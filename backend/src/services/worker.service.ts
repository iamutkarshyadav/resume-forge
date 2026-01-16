import { logger } from "../utils/logger";
import * as pdfService from "./pdf.service";
import * as jobService from "./job.service";
import * as matchService from "./match.service";
import prisma from "../prismaClient";

async function cleanupStuckJobs() {
  try {
    const updated = await prisma.job.updateMany({
      where: { status: "processing" },
      data: { status: "pending" }
    });
    if (updated.count > 0) {
      logger.info(`Reset ${updated.count} stuck jobs to pending.`);
    }
  } catch (err) {
    logger.error("Failed to cleanup stuck jobs", err);
  }
}

// Simulating a simple queue with a loop
let isRunning = false;
let isFirstRun = true;

export async function processQueue() {
  if (isRunning) return;
  isRunning = true;

  try {
    if (isFirstRun) {
      await cleanupStuckJobs();
      isFirstRun = false;
    }
    const pendingJob = await prisma.job.findFirst({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });

    if (pendingJob) {
      await executeJob(pendingJob.id);
    }
  } catch (err) {
    logger.error("Error in processQueue", err);
  } finally {
    isRunning = false;
    // Schedule next check
    setTimeout(processQueue, 1000);
  }
}

async function executeJob(jobId: string) {
  const job = await jobService.getJob(jobId);
  if (!job) return;

  await jobService.startJob(jobId);

  try {
    let result: any;
    switch (job.type) {
      case "analyze_match":
        result = await matchService.analyzeMatchInternal(job.userId, job.data as any);
        break;
      case "generate_resume":
        result = await matchService.generateForMatchInternal(job.userId, job.data as any);
        break;
      case "generate_pdf":
        const pdfData = (job.data as any);
        const pdfBuffer = await pdfService.generateResumePDF(pdfData.resumeData);
        result = { pdfBase64: pdfBuffer.toString("base64") };
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Success logic including credit deduction if needed
    if (job.type === ("generate_pdf" as any)) {
      await handlePDFSuccess(jobId, job.userId, result);
    } else {
      await jobService.completeJob(jobId, result);
    }

    logger.info(`Job completed: ${jobId}`);
  } catch (err: any) {
    logger.error(`Job failed: ${jobId}`, { error: err.message });
    await jobService.failJob(jobId, err.message);
  }
}

async function handlePDFSuccess(jobId: string, userId: string, result: any) {
  // Atomic success + deduction
  await prisma.$transaction(async (tx) => {
    // 1. Check if deduction already happened (idempotency)
    const existingTx = await tx.billingTransaction.findFirst({
      where: { 
        userId,
        type: "deduction",
        metadata: { equals: { jobId: jobId } } as any
      }
    });

    if (existingTx) {
      logger.info(`Credit already deducted for jobId: ${jobId}`);
    } else {
      // 2. Deduct credit
      const user = await tx.user.update({
        where: { id: userId },
        data: { credits: { decrement: 1 } },
      });

      if (user.credits < 0) {
        logger.error(`Insufficient credits for user ${userId} at completion of job ${jobId}`);
        throw new Error("Insufficient credits at completion");
      }

      // 3. Record transaction
      await tx.billingTransaction.create({
        data: {
          userId,
          type: "deduction",
          amount: -1,
          reason: "pdf_download",
          metadata: { jobId } as any,
        },
      });
    }

    // 4. Complete job
    await tx.job.update({
      where: { id: jobId },
      data: {
        status: "completed",
        result: result as any,
        completedAt: new Date(),
      },
    });
  }, { timeout: 10000 }); // 10s timeout for safety
}
