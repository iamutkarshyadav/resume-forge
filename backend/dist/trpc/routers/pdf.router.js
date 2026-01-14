"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
const logger_1 = require("../../utils/logger");
const react_1 = __importDefault(require("react"));
// Import from shared package
const shared_1 = require("@resume-forge/shared");
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
            // Step 2: Generate PDF using Unified Renderer (React-PDF)
            logger_1.logger.info("Generating PDF via Unified Renderer", { userId: user.id, fileName });
            let pdfBuffer;
            try {
                // A. Map to AST
                // We cast input to LegacyResumeData because Zod schema matches it structure-wise
                const ast = (0, shared_1.mapToAST)(resumeData, shared_1.DEFAULT_TEMPLATE_RULES);
                // B. Resolve Layout (Strict Backend Re-validation)
                const layout = (0, shared_1.resolveLayout)(ast, shared_1.DEFAULT_TEMPLATE_RULES);
                // C. Render to Stream
                const stream = await (0, shared_1.renderToStream)(react_1.default.createElement(shared_1.ResumeDocument, { layout }));
                // D. Stream to Buffer
                const chunks = [];
                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                pdfBuffer = Buffer.concat(chunks);
            }
            catch (pdfError) {
                logger_1.logger.error("PDF generation failed", {
                    userId: user.id,
                    fileName,
                    error: pdfError.message
                });
                throw new trpc_1.TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: pdfError.message || "Failed to generate PDF. Please try again."
                });
            }
            if (!pdfBuffer || pdfBuffer.length === 0) {
                throw new Error("PDF generation resulted in empty buffer");
            }
            // Step 3: Atomically deduct credit and record transaction
            const [updatedUser, transaction] = await Promise.all([
                ctx.prisma.user.update({
                    where: { id: user.id },
                    data: { credits: userData.credits - 1 },
                    select: { credits: true },
                }),
                ctx.prisma.billingTransaction.create({
                    data: {
                        userId: user.id,
                        type: "deduction",
                        amount: -1,
                        reason: "pdf_download",
                        metadata: {
                            fileName,
                            timestamp: new Date().toISOString(),
                        },
                    },
                }),
            ]);
            logger_1.logger.info("Credit deducted for PDF download", {
                userId: user.id,
                fileName,
                creditsRemaining: updatedUser.credits,
                transactionId: transaction.id
            });
            // Step 4: Return PDF as base64 and metadata
            return {
                success: true,
                pdfBase64: pdfBuffer.toString("base64"),
                fileName: fileName,
                creditsRemaining: updatedUser.credits,
                transactionId: transaction.id,
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
    // Check if user can download PDF (has sufficient credits)
    checkDownloadEligibility: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const userData = await ctx.prisma.user.findUnique({
                where: { id: user.id },
                select: { credits: true },
            });
            return {
                canDownload: (userData?.credits || 0) >= 1,
                credits: userData?.credits || 0,
                creditsNeeded: 1,
            };
        }
        catch (error) {
            if (error instanceof trpc_1.TRPCError)
                throw error;
            logger_1.logger.error("Error checking download eligibility", {
                error: error?.message,
                code: error?.code
            });
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to check eligibility",
            });
        }
    }),
});
