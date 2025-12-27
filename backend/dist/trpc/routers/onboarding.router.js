"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingRouter = void 0;
const trpc_1 = require("../trpc");
const onboardingService = __importStar(require("../../services/onboarding.service"));
const prismaClient_1 = __importDefault(require("../../prismaClient"));
const httpError_1 = require("../../utils/httpError");
const validate_context_1 = require("../validate-context");
exports.onboardingRouter = (0, trpc_1.router)({
    getStatus: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        try {
            // Validate auth context early
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            if (!prismaClient_1.default) {
                throw new trpc_1.TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Database connection unavailable"
                });
            }
            const status = await onboardingService.getOnboardingStatus(user.id);
            // Ensure we always return valid status structure
            if (!status) {
                console.warn(`Empty onboarding status returned for user ${user.id}`);
                throw new httpError_1.HttpError(500, "Failed to retrieve onboarding status");
            }
            return status;
        }
        catch (error) {
            const errorMsg = error?.message || String(error);
            console.error(`[onboarding.getStatus] Error:`, errorMsg);
            // If it's already a TRPCError, rethrow it
            if (error instanceof trpc_1.TRPCError)
                throw error;
            // If it's an HttpError, convert to TRPCError
            if (error instanceof httpError_1.HttpError) {
                console.error(`[onboarding.getStatus] HttpError [status: ${error.status}]: ${error.message}`);
                throw new trpc_1.TRPCError({
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
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: errorMsg || "Failed to get onboarding status"
            });
        }
    }),
    markResumeUploaded: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await onboardingService.markResumeUploaded(user.id);
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update progress"
            });
        }
    }),
    markFirstAnalysisCompleted: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await onboardingService.markFirstAnalysisCompleted(user.id);
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update progress"
            });
        }
    }),
    markJobDescriptionSaved: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await onboardingService.markJobDescriptionSaved(user.id);
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update progress"
            });
        }
    }),
    markProgressViewed: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await onboardingService.markProgressViewed(user.id);
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update progress"
            });
        }
    }),
    skip: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await onboardingService.skipOnboarding(user.id);
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to skip onboarding"
            });
        }
    }),
    complete: trpc_1.protectedProcedure.mutation(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await onboardingService.completeOnboarding(user.id);
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to complete onboarding"
            });
        }
    })
});
