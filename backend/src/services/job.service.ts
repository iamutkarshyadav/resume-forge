import prisma from "../prismaClient";
import { logger } from "../utils/logger";

export type JobType = "analyze_match" | "generate_resume" | "generate_pdf";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

import { pdfQueue } from "../queue/pdf.queue";

export async function createJob(userId: string, type: JobType, data: any, idempotencyKey?: string) {
  const MAX_RETRIES = 5;
  let attempt = 0;
  let job: any;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      // 1. Transaction: Deduct credit (if needed) & Create Job
      job = await prisma.$transaction(async (tx) => {
        // Check for idempotency first to avoid deduction if job exists
        // Note: In high concurrency, this check might pass for multiple requests, 
        // leading to a Unique Constraint violation on creation below.
        if (idempotencyKey) {
          const existing = await tx.job.findUnique({
            where: { 
              userId_idempotencyKey: { userId, idempotencyKey }
            }
          });
          if (existing) return existing;
        }

        // Deduct credits for PDF generation
        if (type === "generate_pdf") {
          const user = await tx.user.update({
            where: { id: userId },
            data: { credits: { decrement: 1 } }
          });

          if (user.credits < 0) {
            throw new Error("Insufficient credits");
          }
        }

        // Create Job
        return tx.job.create({
            data: {
              userId,
              type,
              status: "pending", // Worker will pick it up
              data: data as any,
              idempotencyKey: idempotencyKey || null,
            } as any,
        });
      });
      
      // If success, break loop
      break;

    } catch (error: any) {
      // Retry on Write Conflict (P2034), Transaction Closed (P2028), OR Unique Constraint (P2002) ONLY if idempotency key is used
      // P2002 means we lost the race condition, so retrying should find the existing job.
      const isRetryable = error.code === 'P2034' || error.code === 'P2028' || (error.code === 'P2002' && idempotencyKey);
      
      if (isRetryable && attempt < MAX_RETRIES) {
        logger.warn(`Transaction failed (attempt ${attempt}/${MAX_RETRIES}). Code: ${error.code}. Retrying in ${attempt * 200}ms... Error: ${error.message}`);
        await new Promise(r => setTimeout(r, attempt * 200)); 
        continue;
      }
      
      logger.error(`Transaction failed permanently after ${attempt} attempts. Code: ${error.code}. Error: ${error.message}`);
      throw error; // Rethrow if not retryable or max retries reached
    }
  }

  // 2. Producer: Add to Queue (Fire and Forget)
  // Only add to queue if it's a new job (created recently)
  if (job && job.createdAt.getTime() > Date.now() - 5000) { 
     // Add ALL job types to the queue
     await pdfQueue.add(type, { jobId: job.id, userId, data }, {
       jobId: job.id, // Use DB ID as BullMQ ID for deduplication in queue
     });
     logger.info(`Job added to queue: ${job.id} (${type})`);
  } else if (job) {
     logger.info(`Returning existing job: ${job.id}`);
  }

  return job;
}

export async function getJob(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
  });
}

export async function startJob(jobId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: "processing",
      startedAt: new Date(),
    },
  });
}

export async function completeJob(jobId: string, result: any) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: "completed",
      result: result as any,
      completedAt: new Date(),
    },
  });
}

export async function failJob(jobId: string, error: string) {
  const job = (await prisma.job.findUnique({ where: { id: jobId } })) as any;
  if (!job) return;

  const canRetry = job.retries < job.maxRetries;
  
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: canRetry ? "pending" : "failed",
      error,
      retries: { increment: 1 } as any,
      completedAt: canRetry ? null : new Date(),
    } as any,
  });
}
