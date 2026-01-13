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
exports.matchRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
const matchService = __importStar(require("../../services/match.service"));
const rateLimitService = __importStar(require("../../services/rateLimit.service"));
exports.matchRouter = (0, trpc_1.router)({
    analyzeResumeToJD: trpc_1.protectedProcedure
        .input(zod_1.z.object({ resumeId: zod_1.z.string(), jdId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            // Check short-term rate limit (prevents accidental infinite generation)
            // Note: Analysis is free - no credits/plan limits required
            try {
                rateLimitService.checkAIRateLimit(user.id, "analyze", 5, 60000); // 5 per minute
            }
            catch (rateLimitError) {
                if (rateLimitError.status === 429) {
                    throw new trpc_1.TRPCError({
                        code: "TOO_MANY_REQUESTS",
                        message: rateLimitError.message
                    });
                }
                throw rateLimitError;
            }
            // No plan limit check - analysis is free for all users
            const res = await matchService.analyzeMatch({ id: user.id, role: user.role }, input.resumeId, input.jdId);
            // Note: Not incrementing usage since analysis is free for all users
            // Usage metrics can still be tracked elsewhere if needed for analytics
            return res;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            // Log error safely
            const errorMessage = err?.message || "Failed to analyze resume";
            const errorStatus = err?.status || err?.code || 500;
            console.error("Error analyzing resume to JD:", { error: errorMessage, status: errorStatus });
            throw new trpc_1.TRPCError({
                code: errorStatus === 429 ? "TOO_MANY_REQUESTS" : errorStatus === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                message: errorMessage
            });
        }
    }),
    generateResumeForJD: trpc_1.protectedProcedure
        .input(zod_1.z.object({ resumeId: zod_1.z.string(), jdId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            // Check short-term rate limit (prevents accidental infinite generation)
            // Note: AI generation is free - no credits/plan limits required
            try {
                rateLimitService.checkAIRateLimit(user.id, "generate", 3, 120000); // 3 per 2 minutes (more restrictive for generation)
            }
            catch (rateLimitError) {
                if (rateLimitError.status === 429) {
                    throw new trpc_1.TRPCError({
                        code: "TOO_MANY_REQUESTS",
                        message: rateLimitError.message
                    });
                }
                throw rateLimitError;
            }
            // No plan limit check - AI generation is free for all users
            const res = await matchService.generateForMatch({ id: user.id, role: user.role }, input.resumeId, input.jdId);
            // Note: Not incrementing usage since generation is free for all users
            // Usage metrics can still be tracked elsewhere if needed for analytics
            return res;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            // Log error safely
            const errorMessage = err?.message || "Failed to generate resume";
            const errorStatus = err?.status || err?.code || 500;
            console.error("Error generating resume for JD:", { error: errorMessage, status: errorStatus });
            throw new trpc_1.TRPCError({
                code: errorStatus === 429 ? "TOO_MANY_REQUESTS" : errorStatus === 400 ? "BAD_REQUEST" : "INTERNAL_SERVER_ERROR",
                message: errorMessage
            });
        }
    }),
    getMatch: trpc_1.protectedProcedure
        .input(zod_1.z.object({ matchId: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const match = await matchService.getMatchById(user.id, input.matchId);
            return match;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            if (err.status === 404)
                throw new trpc_1.TRPCError({ code: "NOT_FOUND", message: err.message });
            if (err.status === 403)
                throw new trpc_1.TRPCError({ code: "FORBIDDEN", message: err.message });
            console.error("Error getting match:", err);
            throw new trpc_1.TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
        }
    })
});
