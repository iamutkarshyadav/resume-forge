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
  get: publicProcedure
    .input(z.object({ resumeId: z.string() }))
    .query(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const res = await ctx.prisma.resume.findUnique({
        where: { id: input.resumeId }
      });

      if (!res) throw new TRPCError({ code: "NOT_FOUND" });

      // Ownership check
      if (res.uploadedById !== current.id && String(current.role || "").toUpperCase() !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return res;
    }),
  delete: publicProcedure
    .input(z.object({ resumeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const res = await ctx.prisma.resume.findUnique({
        where: { id: input.resumeId }
      });

      if (!res) throw new TRPCError({ code: "NOT_FOUND" });

      // Ownership check
      if (res.uploadedById !== current.id && String(current.role || "").toUpperCase() !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const path = (res.jsonData as any)?.path as string | undefined;
      if (path) {
        try {
          require("fs").unlinkSync(path);
        } catch {}
      }

      await ctx.prisma.resume.delete({ where: { id: input.resumeId } });
      return { success: true };
    })
});
