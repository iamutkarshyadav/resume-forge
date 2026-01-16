import { Queue } from "bullmq";
import { redisConnection } from "../redis";

export const pdfQueue = new Queue("pdf-generation-queue", {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true, // Keep memory low
    removeOnFail: false,    // Keep failed jobs for inspection
  },
});
