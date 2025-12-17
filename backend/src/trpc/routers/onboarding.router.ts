import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import * as onboardingService from "../../services/onboarding.service";

export const onboardingRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.getOnboardingStatus(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to get onboarding status"
      });
    }
  }),

  markResumeUploaded: protectedProcedure.mutation(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.markResumeUploaded(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to update progress"
      });
    }
  }),

  markFirstAnalysisCompleted: protectedProcedure.mutation(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.markFirstAnalysisCompleted(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to update progress"
      });
    }
  }),

  markJobDescriptionSaved: protectedProcedure.mutation(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.markJobDescriptionSaved(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to update progress"
      });
    }
  }),

  markProgressViewed: protectedProcedure.mutation(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.markProgressViewed(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to update progress"
      });
    }
  }),

  skip: protectedProcedure.mutation(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.skipOnboarding(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to skip onboarding"
      });
    }
  }),

  complete: protectedProcedure.mutation(async ({ ctx }) => {
    const current = (ctx.req as any).user;
    if (!current) throw new TRPCError({ code: "UNAUTHORIZED" });

    try {
      return await onboardingService.completeOnboarding(current.id);
    } catch (error: any) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to complete onboarding"
      });
    }
  })
});
