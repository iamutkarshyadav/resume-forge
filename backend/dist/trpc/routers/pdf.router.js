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
exports.pdfRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const validate_context_1 = require("../validate-context");
const logger_1 = require("../../utils/logger");
const jobService = __importStar(require("../../services/job.service"));
// HTML rendering removed in Phase 1 overhaul
// Puppeteer removed in Phase 1 overhaul
// Schema for resume data (matches frontend structure)
// We keep this to validate input struct, then transform to AST
const ResumeDataSchema = zod_1.z.object({
    name: zod_1.z.string(),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string(),
    location: zod_1.z.string().optional(),
    title: zod_1.z.string().optional(),
    summary: zod_1.z.string(),
    links: zod_1.z
        .object({
        linkedin: zod_1.z.string().optional(),
        github: zod_1.z.string().optional(),
        portfolio: zod_1.z.string().optional(),
    })
        .optional(),
    skills: zod_1.z.union([
        zod_1.z.array(zod_1.z.string()),
        zod_1.z.array(zod_1.z.object({
            category: zod_1.z.string(),
            items: zod_1.z.array(zod_1.z.string()),
        })),
    ]),
    experience: zod_1.z.array(zod_1.z.object({
        company: zod_1.z.string().optional(),
        role: zod_1.z.string().optional(),
        title: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        start: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        end: zod_1.z.string().optional(),
        location: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        bullets: zod_1.z.array(zod_1.z.string()).optional(),
    })),
    projects: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        tech: zod_1.z.array(zod_1.z.string()).optional(),
        bullets: zod_1.z.array(zod_1.z.string()).optional(),
    })),
    education: zod_1.z.array(zod_1.z.object({
        institution: zod_1.z.string().optional(),
        degree: zod_1.z.string().optional(),
        field: zod_1.z.string().optional(),
        startYear: zod_1.z.string().optional(),
        start: zod_1.z.string().optional(),
        endYear: zod_1.z.string().optional(),
        end: zod_1.z.string().optional(),
        gpa: zod_1.z.string().optional(),
    })),
});
exports.pdfRouter = (0, trpc_1.router)({
    // Generate and download PDF with automatic credit deduction
    generateAndDownloadPDF: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        resumeData: ResumeDataSchema,
        fileName: zod_1.z
            .string()
            .min(1, "File name required")
            .max(255, "File name too long"),
    }))
        .mutation(async ({ input, ctx }) => {
        const user = (0, validate_context_1.validateAuthContext)(ctx);
        const { resumeData, fileName } = input;
        try {
            // Step 1: Check if user has credits
            const userData = await ctx.prisma.user.findUnique({
                where: { id: user.id },
                select: { credits: true },
            });
            if (!userData || userData.credits < 1) {
                throw new trpc_1.TRPCError({
                    code: "PRECONDITION_FAILED",
                    message: "Insufficient credits. Please purchase credits to download PDF.",
                });
            }
            // Step 2: Create Job
            const hash = (0, crypto_1.createHash)("md5")
                .update(user.id + JSON.stringify(resumeData))
                .digest("hex");
            const idempotencyKey = `pdf_${hash}`;
            const job = await jobService.createJob(user.id, "generate_pdf", {
                resumeData,
                fileName
            }, idempotencyKey);
            logger_1.logger.info("PDF Generation Job created", { userId: user.id, jobId: job.id });
            return {
                success: true,
                jobId: job.id
            };
        }
        catch (error) {
            // Log the error for debugging
            logger_1.logger.error("PDF generation failed", {
                userId: user.id,
                fileName,
                error: error?.message,
                code: error?.code,
                stack: error?.stack
            });
            // Re-throw TRPC errors
            if (error instanceof trpc_1.TRPCError) {
                throw error;
            }
            // Throw generic error with safe message extraction
            throw new trpc_1.TRPCError({
                code: error?.code === "PRECONDITION_FAILED" ? "PRECONDITION_FAILED" : "INTERNAL_SERVER_ERROR",
                message: error?.message || "Failed to generate PDF. Please try again.",
            });
        }
    }),
    checkDownloadEligibility: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        const user = (0, validate_context_1.validateAuthContext)(ctx);
        const userData = await ctx.prisma.user.findUnique({
            where: { id: user.id },
            select: { credits: true },
        });
        return {
            canDownload: (userData?.credits ?? 0) > 0,
            credits: userData?.credits ?? 0,
        };
    }),
});
