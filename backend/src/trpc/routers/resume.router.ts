import { router, publicProcedure, TRPCError } from "../trpc";
import { z } from "zod";

export const resumeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return ctx.prisma.resume.findMany({ where: { uploadedById: current.id } });
  }),
  get: publicProcedure.input(z.object({ resumeId: z.string() })).query(async ({ input, ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const res = await ctx.prisma.resume.findFirst({ where: { id: input.resumeId, uploadedById: current.id } });
    if (!res) throw new TRPCError({ code: "NOT_FOUND" });
    return res;
  }),
  delete: publicProcedure.input(z.object({ resumeId: z.string() })).mutation(async ({ input, ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const res = await ctx.prisma.resume.findFirst({ where: { id: input.resumeId, uploadedById: current.id } });
    if (!res) throw new TRPCError({ code: "NOT_FOUND" });
    const path = (res.jsonData as any)?.path as string | undefined;
    if (path) {
      try { require("fs").unlinkSync(path); } catch {}
    }
    await ctx.prisma.resume.delete({ where: { id: input.resumeId }});
    return { success: true };
  })
});
