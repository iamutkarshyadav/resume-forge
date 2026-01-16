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
exports.jobDescriptionRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
const jdService = __importStar(require("../../services/jobDescription.service"));
const httpError_1 = require("../../utils/httpError");
exports.jobDescriptionRouter = (0, trpc_1.router)({
    save: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        title: zod_1.z.string().min(1, "Title required"),
        company: zod_1.z.string().optional(),
        fullText: zod_1.z.string().min(1, "Job description text required"),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const jd = await jdService.saveJobDescription(user.id, input.title, input.company, input.fullText, input.tags);
            return jd;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error saving job description:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to save job description"
            });
        }
    }),
    list: trpc_1.protectedProcedure
        .input(zod_1.z.object({ tag: zod_1.z.string().nullish() }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const jds = await jdService.listJobDescriptions(user.id, input.tag || undefined);
            return jds;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error listing job descriptions:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to list job descriptions"
            });
        }
    }),
    get: trpc_1.protectedProcedure
        .input(zod_1.z.object({ jdId: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const jd = await jdService.getJobDescription(user.id, input.jdId);
            return jd;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            const status = (0, httpError_1.getErrorStatus)(err);
            console.error("Error getting job description:", err);
            throw new trpc_1.TRPCError({
                code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to get job description"
            });
        }
    }),
    update: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        jdId: zod_1.z.string(),
        title: zod_1.z.string().optional(),
        company: zod_1.z.string().optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional()
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const updated = await jdService.updateJobDescription(user.id, input.jdId, {
                title: input.title,
                company: input.company,
                tags: input.tags
            });
            return updated;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            const status = (0, httpError_1.getErrorStatus)(err);
            console.error("Error updating job description:", err);
            throw new trpc_1.TRPCError({
                code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to update job description"
            });
        }
    }),
    delete: trpc_1.protectedProcedure
        .input(zod_1.z.object({ jdId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const result = await jdService.deleteJobDescription(user.id, input.jdId);
            return result;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            const status = (0, httpError_1.getErrorStatus)(err);
            console.error("Error deleting job description:", err);
            throw new trpc_1.TRPCError({
                code: status === 404 ? "NOT_FOUND" : status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to delete job description"
            });
        }
    }),
    search: trpc_1.protectedProcedure
        .input(zod_1.z.object({ query: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const results = await jdService.searchJobDescriptions(user.id, input.query);
            return results;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error searching job descriptions:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to search job descriptions"
            });
        }
    })
});
