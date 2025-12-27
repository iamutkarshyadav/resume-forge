import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import * as onboardingService from "../../services/onboarding.service";
import prisma from "../../prismaClient";
import { HttpError } from "../../utils/httpError";
import { validateAuthContext } from "../validate-context";

export const onboardingRouter = router({
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Validate auth context early
      const user = validateAuthContext(ctx);

      if (!prisma) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection unavailable"
        });
      }

      const status = await onboardingService.getOnboardingStatus(user.id);

      // Ensure we always return valid status structure
      if (!status) {
        console.warn(`Empty onboarding status returned for user ${user.id}`);
        throw new HttpError(500, "Failed to retrieve onboarding status");
      }

      return status;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error(`[onboarding.getStatus] Error:`, errorMsg);

      // If it's already a TRPCError, rethrow it
      if (error instanceof TRPCError) throw error;

      // If it's an HttpError, convert to TRPCError
      if (error instanceof HttpError) {
        console.error(`[onboarding.getStatus] HttpError [status: ${error.status}]: ${error.message}`);
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" :
                error.status === 404 ? "NOT_FOUND" :
                error.status === 401 ? "UNAUTHORIZED" :
                "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }

      // For unknown errors, provide max detail for debugging
      console.error(`[onboarding.getStatus] Unexpected error type:`, {
        message: errorMsg,
        code: error?.code,
        type: error?.constructor?.name,
      });

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: errorMsg || "Failed to get onboarding status"
      });
    }
  }),

  markResumeUploaded: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await onboardingService.markResumeUploaded(user.id);
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update progress"
      });
    }
  }),

  markFirstAnalysisCompleted: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await onboardingService.markFirstAnalysisCompleted(user.id);
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update progress"
      });
    }
  }),

  markJobDescriptionSaved: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await onboardingService.markJobDescriptionSaved(user.id);
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update progress"
      });
    }
  }),

  markProgressViewed: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await onboardingService.markProgressViewed(user.id);
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update progress"
      });
    }
  }),

  skip: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await onboardingService.skipOnboarding(user.id);
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to skip onboarding"
      });
    }
  }),

  complete: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);
      return await onboardingService.completeOnboarding(user.id);
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to complete onboarding"
      });
    }
  })
});
