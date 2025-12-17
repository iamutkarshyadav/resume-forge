import { router, publicProcedure, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import * as matchService from "../../services/match.service";
import * as planService from "../../services/plan.service";
import * as resumeVersionService from "../../services/resumeVersion.service";

export const matchRouter = router({
  analyzeResumeToJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdText: z.string(), jdId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check usage limit
      const limitCheck = await planService.checkLimit(current.id, "analyses");
      if (!limitCheck.allowed && limitCheck.limit !== -1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Analysis limit reached. You have ${limitCheck.remaining} analyses remaining this month.`
        });
      }

      const res = await matchService.analyzeMatch({ id: current.id, role: current.role }, input.resumeId, input.jdText, input.jdId);

      // Increment usage
      await planService.incrementUsage(current.id, "analyses");

      return res;
    }),

  generateResumeForJD: protectedProcedure
    .input(z.object({ resumeId: z.string(), jdText: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Check usage limit
      const limitCheck = await planService.checkLimit(current.id, "aiGenerations");
      if (!limitCheck.allowed && limitCheck.limit !== -1) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `AI generation limit reached. You have ${limitCheck.remaining} generations remaining this month.`
        });
      }

      const res = await matchService.generateForMatch({ id: current.id, role: current.role }, input.resumeId, input.jdText);

      // Increment usage
      await planService.incrementUsage(current.id, "aiGenerations");

      return res;
    }),

  getMatch: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });
      try {
        const match = await matchService.getMatchById(current.id, input.matchId);
        return match;
      } catch (err: any) {
        if (err.status === 404) throw new TRPCError({ code: "NOT_FOUND", message: err.message });
        if (err.status === 403) throw new TRPCError({ code: "FORBIDDEN", message: err.message });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    })
});
