import { router, publicProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import * as matchService from "../../services/match.service";

export const matchRouter = router({
  analyzeResumeToJD: publicProcedure
    .input(z.object({ resumeId: z.string(), jdText: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });
      const res = await matchService.analyzeMatch({ id: current.id, role: current.role }, input.resumeId, input.jdText);
      return res;
    }),

  generateResumeForJD: publicProcedure
    .input(z.object({ resumeId: z.string(), jdText: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });
      const res = await matchService.generateForMatch({ id: current.id, role: current.role }, input.resumeId, input.jdText);
      return res;
    }),

  getMatch: publicProcedure.input(z.object({ matchId: z.string() })).query(async ({ input, ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });
    const match = await matchService.getMatchById(input.matchId);
    if (!match) throw new TRPCError({ code: "NOT_FOUND" });
    return match;
  })
});
