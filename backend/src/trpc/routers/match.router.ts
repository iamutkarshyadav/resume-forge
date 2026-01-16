import { router, publicProcedure, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as matchService from "../../services/match.service";
import * as planService from "../../services/plan.service";
import * as resumeVersionService from "../../services/resumeVersion.service";
import * as rateLimitService from "../../services/rateLimit.service";

import * as jobService from "../../services/job.service";

export const matchRouter = router({
  analyzeResumeToJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = validateAuthContext(ctx);

      // 1. Rate Limit Check
      try {
        rateLimitService.checkAIRateLimit(user.id, "analyze", 5, 60000); // 5 per minute
      } catch (rateLimitError: any) {
        if (rateLimitError.status === 429) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: rateLimitError.message });
        }
        throw rateLimitError;
      }

      const idempotencyKey = `analyze_${input.resumeId}_${input.jdId}`;

      // 2. Create Job
      const job = await jobService.createJob(user.id, "analyze_match", {
        resumeId: input.resumeId,
        jdId: input.jdId
      }, idempotencyKey);

      return { jobId: job.id };
    }),

  generateResumeForJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = validateAuthContext(ctx);

      // 1. Rate Limit Check
      try {
        rateLimitService.checkAIRateLimit(user.id, "generate", 3, 120000); // 3 per 2 minutes
      } catch (rateLimitError: any) {
        if (rateLimitError.status === 429) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: rateLimitError.message });
        }
        throw rateLimitError;
      }

      const idempotencyKey = `generate_${input.resumeId}_${input.jdId}`;

      // 2. Create Job
      const job = await jobService.createJob(user.id, "generate_resume", {
        resumeId: input.resumeId,
        jdId: input.jdId
      }, idempotencyKey);

      return { jobId: job.id };
    }),

  getMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const match = await matchService.getMatchById(user.id, input.matchId);
        return match;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        if (err.status === 404) throw new TRPCError({ code: "NOT_FOUND", message: err.message });
        if (err.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: err.message });
        console.error("Error getting match:", err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    })
});
