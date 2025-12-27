import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import fs from "fs";

export const resumeRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await ctx.prisma.resume.findMany({ where: { uploadedById: user.id } });
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("Error listing resumes:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list resumes"
      });
    }
  }),
  get: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const resume = await ctx.prisma.resume.findUnique({
          where: { id: input.resumeId }
        });

        if (!resume) throw new TRPCError({ code: "NOT_FOUND" });

        // Ownership check
        if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return resume;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error fetching resume:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch resume"
        });
      }
    }),
  delete: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const resume = await ctx.prisma.resume.findUnique({
          where: { id: input.resumeId }
        });

        if (!resume) throw new TRPCError({ code: "NOT_FOUND" });

        // Ownership check
        if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Delete file from filesystem with error logging
        const path = (resume.jsonData as any)?.path as string | undefined;
        if (path) {
          try {
            fs.unlinkSync(path);
          } catch (err: any) {
            console.warn(`Failed to delete file at ${path}:`, err?.message || String(err));
            // Continue - database deletion should still succeed
          }
        }

        await ctx.prisma.resume.delete({ where: { id: input.resumeId } });
        return { success: true };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error deleting resume:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete resume"
        });
      }
    })
});
