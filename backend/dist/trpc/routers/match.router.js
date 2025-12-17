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
const matchService = __importStar(require("../../services/match.service"));
const planService = __importStar(require("../../services/plan.service"));
exports.matchRouter = (0, trpc_1.router)({
    analyzeResumeToJD: trpc_1.protectedProcedure
        .input(zod_1.z.object({ resumeId: zod_1.z.string(), jdText: zod_1.z.string(), jdId: zod_1.z.string().optional() }))
        .mutation(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        // Check usage limit
        const limitCheck = await planService.checkLimit(current.id, "analyses");
        if (!limitCheck.allowed && limitCheck.limit !== -1) {
            throw new trpc_1.TRPCError({
                code: "FORBIDDEN",
                message: `Analysis limit reached. You have ${limitCheck.remaining} analyses remaining this month.`
            });
        }
        const res = await matchService.analyzeMatch({ id: current.id, role: current.role }, input.resumeId, input.jdText, input.jdId);
        // Increment usage
        await planService.incrementUsage(current.id, "analyses");
        return res;
    }),
    generateResumeForJD: trpc_1.protectedProcedure
        .input(zod_1.z.object({ resumeId: zod_1.z.string(), jdText: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        // Check usage limit
        const limitCheck = await planService.checkLimit(current.id, "aiGenerations");
        if (!limitCheck.allowed && limitCheck.limit !== -1) {
            throw new trpc_1.TRPCError({
                code: "FORBIDDEN",
                message: `AI generation limit reached. You have ${limitCheck.remaining} generations remaining this month.`
            });
        }
        const res = await matchService.generateForMatch({ id: current.id, role: current.role }, input.resumeId, input.jdText);
        // Increment usage
        await planService.incrementUsage(current.id, "aiGenerations");
        return res;
    }),
    getMatch: trpc_1.protectedProcedure
        .input(zod_1.z.object({ matchId: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current)
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        const match = await matchService.getMatchById(input.matchId);
        if (!match)
            throw new trpc_1.TRPCError({ code: "NOT_FOUND" });
        return match;
    })
});
