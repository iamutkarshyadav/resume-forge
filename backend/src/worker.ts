import { Worker, Job as BullJob } from "bullmq";
import { env } from "./utils/env";
import prisma from "./prismaClient";
import { logger } from "./utils/logger";
import * as pdfService from "./services/pdf.service";
import * as matchService from "./services/match.service";
import { redisConnection } from "./redis";

export async function startWorker() {
  logger.info("Starting Worker...");

  const worker = new Worker(
    "pdf-generation-queue",
    async (job: BullJob) => {
      const { jobId, userId, data } = job.data;
      const jobName = job.name; // "generate_pdf", "analyze_match", etc.

      logger.info(`Processing job ${jobId} (${jobName})`);

      try {
        // Mark as processing
        await prisma.job.update({
          where: { id: jobId },
          data: { 
            status: "processing",
            startedAt: new Date()
          },
        });

        let result: any;

        switch (jobName) {
          case "generate_pdf": {
             const pdfBuffer = await pdfService.generateResumePDF(data.resumeData);
             result = { pdfBase64: pdfBuffer.toString("base64") };
             break;
          }
          case "analyze_match": {
             // Re-using existing service logic
             // Note: matchService methods might need refactoring if they assume they are called directly
             // But based on worker.service.ts, they were awaiting results.
             result = await matchService.analyzeMatchInternal(userId, data);
             break;
          }
          case "generate_resume": {
             result = await matchService.generateForMatchInternal(userId, data);
             break;
          }
          default:
             throw new Error(`Unknown job type: ${jobName}`);
        }

        // Completion Logic
        await prisma.$transaction(async (tx) => {
             // For PDF, we already deducted credit.
             // Just record the successful transaction/record if needed?
             // worker.service.ts recorded a "billed" transaction.
             // If deducation happened at creation, we might want to log it or finalize it.
             // But we deducted "credits" integer.
             // We may want to insert the BillingTransaction record here for audit.
             
             if (jobName === "generate_pdf") {
                 await tx.billingTransaction.create({
                     data: {
                         userId,
                         type: "deduction",
                         amount: -1,
                         reason: "pdf_download",
                         metadata: { jobId },
                     }
                 });
             }

             await tx.job.update({
                 where: { id: jobId },
                 data: {
                     status: "completed",
                     result: result,
                     completedAt: new Date()
                 }
             });
        });

        logger.info(`Job ${jobId} completed successfully.`);
        return result;

      } catch (err: any) {
        logger.error(`Job ${jobId} failed: ${err.message}`);
        throw err; // Throw to trigger BullMQ retry or completion
      }
    },
    {
       connection: redisConnection as any,
       concurrency: 5,
       limiter: {
           max: 100,
           duration: 60000 
       }
    }
  );

  worker.on('error', err => {
    logger.error("BullMQ Worker Error:", err);
  });
  
  worker.on('failed', async (job, err) => {
    if (!job) return;
    const { jobId, userId, data } = job.data;
    const jobName = job.name;

    logger.error(`Job ${jobId} failed permanently with ${err.message}`);

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Mark Job as Failed in DB
            await tx.job.update({
                where: { id: jobId },
                data: {
                    status: "failed",
                    error: err.message,
                    completedAt: new Date()
                }
            });

            // 2. REFUND LOGIC (Only on permanent failure)
            if (jobName === "generate_pdf") {
                 await tx.user.update({
                    where: { id: userId },
                    data: { credits: { increment: 1 } }
                 });
                 
                 await tx.billingTransaction.create({
                    data: {
                        userId,
                        type: "refund",
                        amount: 1,
                        reason: "job_failure_exhausted",
                        metadata: { jobId, error: err.message }
                    }
                 });
            }
        });
        logger.info(`Refunded and marked job ${jobId} as failed.`);
    } catch (dbErr) {
        logger.error(`Failed to handle permanent failure for job ${jobId}`, dbErr);
    }
  });

  logger.info("Worker started and listening for jobs.");
}

// Add auto-start if run directly
if (require.main === module) {
  startWorker().catch(err => {
    console.error("Worker failed to start", err);
    process.exit(1);
  });
}
