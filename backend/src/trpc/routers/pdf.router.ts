import { router, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import { generatePDF } from "../../services/pdf.service";

// Schema for resume data (matches frontend structure)
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

        // Step 2: Generate PDF
        console.log(`Generating PDF for user ${user.id}: ${fileName}`);
        const pdfBuffer = await generatePDF(resumeData, fileName);

        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error("PDF generation resulted in empty buffer");
        }

        // Step 3: Atomically deduct credit and record transaction
        // Use a transaction to ensure consistency
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

        console.log(
          `Credit deducted for user ${user.id}. Remaining credits: ${updatedUser.credits}`
        );

        // Step 4: Return PDF as base64 and metadata
        return {
          success: true,
          pdfBase64: pdfBuffer.toString("base64"),
          fileName: fileName,
          creditsRemaining: updatedUser.credits,
          transactionId: transaction.id,
        };
      } catch (error: any) {
        // Log the error for debugging
        console.error(`PDF generation failed for user ${user.id}:`, error);

        // Re-throw TRPC errors
        if (error instanceof TRPCError) {
          throw error;
        }

        // Log and throw generic error
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to generate PDF. Please try again.",
        });
      }
    }),

  // Check if user can download PDF (has sufficient credits)
  checkDownloadEligibility: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);

      const userData = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });

      return {
        canDownload: (userData?.credits || 0) >= 1,
        credits: userData?.credits || 0,
        creditsNeeded: 1,
      };
    } catch (error: any) {
      if (error instanceof TRPCError) throw error;
      console.error("Error checking download eligibility:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to check eligibility",
      });
    }
  }),
});
