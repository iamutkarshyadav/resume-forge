import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";

export const fileRouter = router({
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const current = (ctx.req as any).user;
      if (!current) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const resume = await ctx.prisma.resume.findUnique({
        where: { id: input.fileId }
      });

      if (!resume) throw new TRPCError({ code: "NOT_FOUND" });

      // Ownership check
      if (resume.uploadedById !== current.id && String(current.role || "").toUpperCase() !== "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const path = (resume.jsonData as any)?.path as string | undefined;
      if (path) {
        try {
          require("fs").unlinkSync(path);
        } catch {}
      }

      await ctx.prisma.resume.delete({ where: { id: resume.id } });
      return { success: true };
    })
});
