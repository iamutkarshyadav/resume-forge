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
exports.resumeVersionRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const resumeVersionService = __importStar(require("../../services/resumeVersion.service"));
exports.resumeVersionRouter = (0, trpc_1.router)({
    listVersions: trpc_1.protectedProcedure
        .input(zod_1.z.object({ resumeId: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        const user = ctx.req.user;
        if (!user)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        try {
            const versions = await resumeVersionService.listVersions(user.id, input.resumeId);
            return versions;
        }
        catch (err) {
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to list versions"
            });
        }
    }),
    getVersion: trpc_1.protectedProcedure
        .input(zod_1.z.object({ versionId: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        const user = ctx.req.user;
        if (!user)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        try {
            const version = await resumeVersionService.getVersion(user.id, input.versionId);
            return version;
        }
        catch (err) {
            throw new trpc_1.TRPCError({
                code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to get version"
            });
        }
    }),
    restoreVersion: trpc_1.protectedProcedure
        .input(zod_1.z.object({ resumeId: zod_1.z.string(), fromVersionId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        const user = ctx.req.user;
        if (!user)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        try {
            const newVersion = await resumeVersionService.restoreVersion(user.id, input.resumeId, input.fromVersionId);
            return newVersion;
        }
        catch (err) {
            throw new trpc_1.TRPCError({
                code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to restore version"
            });
        }
    }),
    deleteVersion: trpc_1.protectedProcedure
        .input(zod_1.z.object({ versionId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        const user = ctx.req.user;
        if (!user)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        try {
            const result = await resumeVersionService.deleteVersion(user.id, input.versionId);
            return result;
        }
        catch (err) {
            throw new trpc_1.TRPCError({
                code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to delete version"
            });
        }
    }),
    compareVersions: trpc_1.protectedProcedure
        .input(zod_1.z.object({ versionId1: zod_1.z.string(), versionId2: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        const user = ctx.req.user;
        if (!user)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        try {
            const comparison = await resumeVersionService.compareVersions(user.id, input.versionId1, input.versionId2);
            return comparison;
        }
        catch (err) {
            throw new trpc_1.TRPCError({
                code: err.statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
                message: err.message || "Failed to compare versions"
            });
        }
    })
});
