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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
const activityService = __importStar(require("../../services/activity.service"));
exports.activityRouter = (0, trpc_1.router)({
    getRecentMatches: trpc_1.protectedProcedure
        .input(zod_1.z.object({ limit: zod_1.z.number().min(1).max(100).default(10) }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await activityService.getRecentMatches(user.id, input.limit);
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting recent matches:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to get recent matches"
            });
        }
    }),
    getRecentResumes: trpc_1.protectedProcedure
        .input(zod_1.z.object({ limit: zod_1.z.number().min(1).max(100).default(5) }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await activityService.getRecentResumes(user.id, input.limit);
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting recent resumes:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to get recent resumes"
            });
        }
    }),
    getRecentJobDescriptions: trpc_1.protectedProcedure
        .input(zod_1.z.object({ limit: zod_1.z.number().min(1).max(100).default(5) }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await activityService.getRecentJobDescriptions(user.id, input.limit);
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting recent job descriptions:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to get recent job descriptions"
            });
        }
    }),
    getDashboardSummary: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return await activityService.getDashboardSummary(user.id);
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting dashboard summary:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to get dashboard summary"
            });
        }
    })
});
