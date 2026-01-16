import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { createHash } from "crypto";
import { validateAuthContext } from "../validate-context";
import { logger } from "../../utils/logger";
import * as jobService from "../../services/job.service";
import { 
  mapToAST, 
  resolveLayout, 
  DEFAULT_TEMPLATE_RULES,
  LegacyResumeData
} from "@resume-forge/shared";
// HTML rendering removed in Phase 1 overhaul
// Puppeteer removed in Phase 1 overhaul

// Schema for resume data (matches frontend structure)
// We keep this to validate input struct, then transform to AST
const ResumeDataSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  location: z.string().optional(),
  title: z.string().optional(),
  summary: z.string(),
  links: z
    .object({
      linkedin: z.string().optional(),
      github: z.string().optional(),
      portfolio: z.string().optional(),
    })
    .optional(),
  skills: z.union([
    z.array(z.string()),
    z.array(
      z.object({
        category: z.string(),
        items: z.array(z.string()),
      })
    ),
  ]),
  experience: z.array(
    z.object({
      company: z.string().optional(),
      role: z.string().optional(),
      title: z.string().optional(),
      startDate: z.string().optional(),
      start: z.string().optional(),
      endDate: z.string().optional(),
      end: z.string().optional(),
      location: z.string().optional(),
      description: z.string().optional(),
      bullets: z.array(z.string()).optional(),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      tech: z.array(z.string()).optional(),
      bullets: z.array(z.string()).optional(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string().optional(),
      degree: z.string().optional(),
      field: z.string().optional(),
      startYear: z.string().optional(),
      start: z.string().optional(),
      endYear: z.string().optional(),
      end: z.string().optional(),
      gpa: z.string().optional(),
    })
  ),
});

export const pdfRouter = router({
  // Generate and download PDF with automatic credit deduction
  generateAndDownloadPDF: protectedProcedure
    .input(
      z.object({
        resumeData: ResumeDataSchema,
        fileName: z
          .string()
          .min(1, "File name required")
          .max(255, "File name too long"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = validateAuthContext(ctx);
      const { resumeData, fileName } = input;

      try {
        // Step 1: Check if user has credits
        const userData = await ctx.prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true },
        });

        if (!userData || userData.credits < 1) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Insufficient credits. Please purchase credits to download PDF.",
          });
        }

// Step 2: Create Job
        const hash = createHash("md5")
          .update(user.id + JSON.stringify(resumeData))
          .digest("hex");
        const idempotencyKey = `pdf_${hash}`;

        const job = await jobService.createJob(user.id, "generate_pdf", {
          resumeData,
          fileName
        }, idempotencyKey);

        logger.info("PDF Generation Job created", { userId: user.id, jobId: job.id });

        return {
          success: true,
          jobId: job.id
        };
      } catch (error: any) {
        // Log the error for debugging
        logger.error("PDF generation failed", { 
          userId: user.id, 
          fileName,
          error: error?.message,
          code: error?.code,
          stack: error?.stack 
        });

        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }

        // Throw generic error with safe message extraction
        throw new TRPCError({
          code: error?.code === "PRECONDITION_FAILED" ? "PRECONDITION_FAILED" : "INTERNAL_SERVER_ERROR",
          message: error?.message || "Failed to generate PDF. Please try again.",
        });
      }
    }),

  checkDownloadEligibility: protectedProcedure.query(async ({ ctx }) => {
    const user = validateAuthContext(ctx);
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
