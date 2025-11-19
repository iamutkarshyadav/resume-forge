import { router, publicProcedure, TRPCError } from "../trpc";
import { z } from "zod";

export const fileRouter = router({
  listFiles: publicProcedure.input(z.object({ userId: z.string() })).query(async ({ input, ctx }) => {
    const current = (ctx.req as any).user;
    if (!current || current.id !== input.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return ctx.prisma.resume.findMany({ where: { uploadedById: input.userId }, orderBy: { createdAt: "desc" } });
  }),
  deleteFile: publicProcedure.input(z.object({ fileId: z.string() })).mutation(async ({ input, ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const resume = await ctx.prisma.resume.findFirst({ where: { id: input.fileId, uploadedById: current.id }});
    if (!resume) throw new TRPCError({ code: "NOT_FOUND" });
    const path = (resume.jsonData as any)?.path as string | undefined;
    if (path) {
      try {
        require("fs").unlinkSync(path);
      } catch {}
    }
    await ctx.prisma.resume.delete({ where: { id: resume.id }});
    return { success: true };
  })
});
