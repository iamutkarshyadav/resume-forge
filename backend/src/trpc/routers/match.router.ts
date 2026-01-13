import { router, publicProcedure, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as matchService from "../../services/match.service";
import * as planService from "../../services/plan.service";
import * as resumeVersionService from "../../services/resumeVersion.service";
import * as rateLimitService from "../../services/rateLimit.service";

export const matchRouter = router({
  analyzeResumeToJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        // Check short-term rate limit (prevents accidental infinite generation)
        // Note: Analysis is free - no credits/plan limits required
        try {
          rateLimitService.checkAIRateLimit(user.id, "analyze", 5, 60000); // 5 per minute
        } catch (rateLimitError: any) {
          if (rateLimitError.status === 429) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: rateLimitError.message
            });
          }
          throw rateLimitError;
        }

        // No plan limit check - analysis is free for all users
        const res = await matchService.analyzeMatch({ id: user.id, role: user.role }, input.resumeId, input.jdId);

        // Note: Not incrementing usage since analysis is free for all users
        // Usage metrics can still be tracked elsewhere if needed for analytics

        return res;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        // Log error safely
        const errorMessage = err?.message || "Failed to analyze resume";
        const errorStatus = err?.status || err?.code || 500;
        console.error("Error analyzing resume to JD:", { error: errorMessage, status: errorStatus });
        throw new TRPCError({
          code: errorStatus === 429 ? "TOO_MANY_REQUESTS" : errorStatus === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: errorMessage
        });
      }
    }),

  generateResumeForJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        // Check short-term rate limit (prevents accidental infinite generation)
        // Note: AI generation is free - no credits/plan limits required
        try {
          rateLimitService.checkAIRateLimit(user.id, "generate", 3, 120000); // 3 per 2 minutes (more restrictive for generation)
        } catch (rateLimitError: any) {
          if (rateLimitError.status === 429) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: rateLimitError.message
            });
          }
          throw rateLimitError;
        }

        // No plan limit check - AI generation is free for all users
        const res = await matchService.generateForMatch({ id: user.id, role: user.role }, input.resumeId, input.jdId);

        // Note: Not incrementing usage since generation is free for all users
        // Usage metrics can still be tracked elsewhere if needed for analytics

        return res;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        // Log error safely
        const errorMessage = err?.message || "Failed to generate resume";
        const errorStatus = err?.status || err?.code || 500;
        console.error("Error generating resume for JD:", { error: errorMessage, status: errorStatus });
        throw new TRPCError({
          code: errorStatus === 429 ? "TOO_MANY_REQUESTS" : errorStatus === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: errorMessage
        });
      }
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
