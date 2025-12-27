import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as activityService from "../../services/activity.service";

export const activityRouter = router({
  getRecentMatches: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);
        return await activityService.getRecentMatches(user.id, input.limit);
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error getting recent matches:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to get recent matches"
        });
      }
    }),

  getRecentResumes: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(5) }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);
        return await activityService.getRecentResumes(user.id, input.limit);
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error getting recent resumes:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to get recent resumes"
        });
      }
    }),

  getRecentJobDescriptions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(5) }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);
        return await activityService.getRecentJobDescriptions(user.id, input.limit);
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error getting recent job descriptions:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to get recent job descriptions"
        });
      }
    }),

  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await activityService.getDashboardSummary(user.id);
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("Error getting dashboard summary:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get dashboard summary"
      });
    }
  })
});
