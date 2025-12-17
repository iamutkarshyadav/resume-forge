import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as activityService from "../../services/activity.service";

export const activityRouter = router({
  getRecentMatches: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new Error("Unauthorized");
      return activityService.getRecentMatches(user.id, input.limit);
    }),

  getRecentResumes: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(5) }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new Error("Unauthorized");
      return activityService.getRecentResumes(user.id, input.limit);
    }),

  getRecentJobDescriptions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(5) }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new Error("Unauthorized");
      return activityService.getRecentJobDescriptions(user.id, input.limit);
    }),

  getDashboardSummary: protectedProcedure.query(async ({ ctx }) => {
    const user = (ctx.req as any).user;
    if (!user) throw new Error("Unauthorized");
    return activityService.getDashboardSummary(user.id);
  })
});
