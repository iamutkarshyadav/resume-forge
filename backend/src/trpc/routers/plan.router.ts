import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import * as planService from "../../services/plan.service";

export const planRouter = router({
  getPlan: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);

      const plan = await planService.getPlan(user.id);
      return plan;
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("Error getting plan:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get plan"
      });
    }
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);

      const usage = await planService.getUsage(user.id);
      return usage;
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("Error getting usage:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get usage"
      });
    }
  }),

  checkLimit: protectedProcedure
    .input(z.object({ limitType: z.enum(["analyses", "aiGenerations", "jdsSaved"]) }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const result = await planService.checkLimit(user.id, input.limitType);
        return result;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error checking limit:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to check limit"
        });
      }
    }),

  getMetrics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);

      const metrics = await planService.getUserMetrics(user.id);
      return metrics;
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("Error getting metrics:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: err.message || "Failed to get metrics"
      });
    }
  }),

  upgradePlan: protectedProcedure
    .input(z.object({ planType: z.enum(["pro", "enterprise"]) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        const updated = await planService.upgradePlan(user.id, input.planType);
        return updated;
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("Error upgrading plan:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message || "Failed to upgrade plan"
        });
      }
    })
});
