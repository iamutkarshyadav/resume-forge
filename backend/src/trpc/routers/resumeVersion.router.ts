import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import * as resumeVersionService from "../../services/resumeVersion.service";

export const resumeVersionRouter = router({
  listVersions: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });
      
      try {
        const versions = await resumeVersionService.listVersions(user.id, input.resumeId);
        return versions;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to list versions"
        });
      }
    }),

  getVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const version = await resumeVersionService.getVersion(user.id, input.versionId);
        return version;
      } catch (err: any) {
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to get version"
        });
      }
    }),

  restoreVersion: protectedProcedure
    .input(z.object({ resumeId: z.string(), fromVersionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const newVersion = await resumeVersionService.restoreVersion(user.id, input.resumeId, input.fromVersionId);
        return newVersion;
      } catch (err: any) {
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to restore version"
        });
      }
    }),

  deleteVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const result = await resumeVersionService.deleteVersion(user.id, input.versionId);
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to delete version"
        });
      }
    }),

  compareVersions: protectedProcedure
    .input(z.object({ versionId1: z.string(), versionId2: z.string() }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const comparison = await resumeVersionService.compareVersions(user.id, input.versionId1, input.versionId2);
        return comparison;
      } catch (err: any) {
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to compare versions"
        });
      }
    })
});
