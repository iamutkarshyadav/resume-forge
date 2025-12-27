import { router, publicProcedure, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as matchService from "../../services/match.service";
import * as planService from "../../services/plan.service";
import * as resumeVersionService from "../../services/resumeVersion.service";

export const matchRouter = router({
  analyzeResumeToJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdText: z.string(), jdId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        // Check usage limit
        const limitCheck = await planService.checkLimit(user.id, "analyses");
        if (!limitCheck.allowed && limitCheck.limit !== -1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Analysis limit reached. You have ${limitCheck.remaining} analyses remaining this month.`
          });
        }

        const res = await matchService.analyzeMatch({ id: user.id, role: user.role }, input.resumeId, input.jdText, input.jdId);

        // Increment usage
        await planService.incrementUsage(user.id, "analyses");

        return res;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error analyzing resume to JD:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to analyze resume"
        });
      }
    }),

  generateResumeForJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdText: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        // Check usage limit
        const limitCheck = await planService.checkLimit(user.id, "aiGenerations");
        if (!limitCheck.allowed && limitCheck.limit !== -1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `AI generation limit reached. You have ${limitCheck.remaining} generations remaining this month.`
          });
        }

        const res = await matchService.generateForMatch({ id: user.id, role: user.role }, input.resumeId, input.jdText);

        // Increment usage
        await planService.incrementUsage(user.id, "aiGenerations");

        return res;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error generating resume for JD:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to generate resume"
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
