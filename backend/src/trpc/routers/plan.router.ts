import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import * as planService from "../../services/plan.service";

export const planRouter = router({
  getPlan: protectedProcedure.query(async ({ ctx }) => {
    const user = (ctx.req as any).user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      const plan = await planService.getPlan(user.id);
      return plan;
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get plan"
      });
    }
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const user = (ctx.req as any).user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      const usage = await planService.getUsage(user.id);
      return usage;
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get usage"
      });
    }
  }),

  checkLimit: protectedProcedure
    .input(z.object({ limitType: z.enum(["analyses", "aiGenerations", "jdsSaved"]) }))
    .query(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const result = await planService.checkLimit(user.id, input.limitType);
        return result;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to check limit"
        });
      }
    }),

  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    const user = (ctx.req as any).user;
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      const metrics = await planService.getUserMetrics(user.id);
      return metrics;
    } catch (err: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get metrics"
      });
    }
  }),

  upgradePlan: protectedProcedure
    .input(z.object({ planType: z.enum(["pro", "enterprise"]) }))
    .mutation(async ({ input, ctx }) => {
      const user = (ctx.req as any).user;
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      try {
        const updated = await planService.upgradePlan(user.id, input.planType);
        return updated;
      } catch (err: any) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to upgrade plan"
        });
      }
    })
});
