import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as resumeVersionService from "../../services/resumeVersion.service";

export const resumeVersionRouter = router({
  listVersions: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const versions = await resumeVersionService.listVersions(user.id, input.resumeId);
        return versions;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error listing resume versions:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to list versions"
        });
      }
    }),

  getVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const version = await resumeVersionService.getVersion(user.id, input.versionId);
        return version;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error getting resume version:", err);
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to get version"
        });
      }
    }),

  restoreVersion: protectedProcedure
    .input(z.object({ resumeId: z.string(), fromVersionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const newVersion = await resumeVersionService.restoreVersion(user.id, input.resumeId, input.fromVersionId);
        return newVersion;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error restoring resume version:", err);
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to restore version"
        });
      }
    }),

  deleteVersion: protectedProcedure
    .input(z.object({ versionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const result = await resumeVersionService.deleteVersion(user.id, input.versionId);
        return result;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error deleting resume version:", err);
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to delete version"
        });
      }
    }),

  compareVersions: protectedProcedure
    .input(z.object({ versionId1: z.string(), versionId2: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const comparison = await resumeVersionService.compareVersions(user.id, input.versionId1, input.versionId2);
        return comparison;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error comparing resume versions:", err);
        throw new TRPCError({
          code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to compare versions"
        });
      }
    })
});
