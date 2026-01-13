import { router, publicProcedure, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import Stripe from "stripe";
import { env } from "../../utils/env";
import { verifyAndGrantCredits } from "../../services/stripe.service";
import { BILLING_PLANS } from "../../config/plans";
import { logger } from "../../utils/logger";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

export const billingRouter = router({
  // Get available plans (public)
  getPlans: publicProcedure.query(async () => {
    return BILLING_PLANS;
  }),

  // Get user's current credits
  getUserCredits: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = validateAuthContext(ctx);

      const userData = await ctx.prisma.user.findUnique({
        where: { id: user.id },
        select: { credits: true },
      });

      if (!userData) {
        logger.error("User not found in getUserCredits", { userId: user.id });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      logger.info("Retrieved user credits", {
        userId: user.id,
        credits: userData.credits,
      });

      return {
        credits: userData.credits,
      };
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      logger.error("Error getting user credits", { 
        error: err?.message || "Unknown error",
        code: err?.code 
      });
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user credits",
      });
    }
  }),

  // Create Stripe checkout session
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["basic", "pro", "executive"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
        // Accept any non-empty string; Stripe itself will enforce idempotency semantics.
        idempotencyKey: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        console.log("📝 Creating checkout session", {
          userId: user.id,
          planId: input.planId,
          idempotencyKey: input.idempotencyKey,
        });

        // ✅ VALIDATE PLAN EXISTS
        const plan = BILLING_PLANS.find((p) => p.id === input.planId);
        if (!plan) {
          console.error("❌ Plan not found:", input.planId);
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Plan "${input.planId}" not found`,
          });
        }

        // ✅ CREATE SESSION
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `${plan.name} Plan - ${plan.credits} Credits`,
                  description: `Get ${plan.credits} PDF download credits`,
                },
                unit_amount: plan.price,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${input.successUrl}${input.successUrl.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: input.cancelUrl,
          client_reference_id: user.id,
          metadata: {
            userId: user.id,
            planId: input.planId,
            credits: plan.credits.toString(),
            idempotencyKey: input.idempotencyKey ?? null, // ✅ Track frontend idempotency
          },
        });

        console.log("✅ Checkout session created", {
          userId: user.id,
          sessionId: session.id,
          planId: input.planId,
          credits: plan.credits,
        });

        return {
          sessionId: session.id,
          url: session.url,
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("❌ Error creating checkout session:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Deduct credits (protected, used by PDF download)
  deductCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().positive(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        console.log("📝 Deducting credits:", {
          userId: user.id,
          amount: input.amount,
          reason: input.reason,
        });

        // Get current credits
        const userData = await ctx.prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true },
        });

        if (!userData || userData.credits < input.amount) {
          console.error("❌ Insufficient credits:", {
            userId: user.id,
            available: userData?.credits || 0,
            requested: input.amount,
          });
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Insufficient credits",
          });
        }

        // Deduct credits and record transaction
        const [updatedUser, transaction] = await Promise.all([
          ctx.prisma.user.update({
            where: { id: user.id },
            data: { credits: userData.credits - input.amount },
            select: { credits: true },
          }),
          ctx.prisma.billingTransaction.create({
            data: {
              userId: user.id,
              type: "deduction",
              amount: -input.amount,
              reason: input.reason,
            },
          }),
        ]);

        console.log("✅ Credits deducted successfully:", {
          userId: user.id,
          deducted: input.amount,
          remaining: updatedUser.credits,
          transactionId: transaction.id,
        });

        return {
          credits: updatedUser.credits,
          transaction,
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("❌ Error deducting credits:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to deduct credits",
        });
      }
    }),

  // Add credits (for webhook use)
  addCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().positive(),
        reason: z.string(),
        stripeSessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        console.log("📝 Adding credits:", {
          userId: user.id,
          amount: input.amount,
          reason: input.reason,
          stripeSessionId: input.stripeSessionId,
        });

        // Check if session already processed (idempotency)
        if (input.stripeSessionId) {
          const existing = await ctx.prisma.billingTransaction.findFirst({
            where: { stripeSessionId: input.stripeSessionId },
          });

          if (existing) {
            console.log("✅ Credits already added (idempotent):", {
              userId: user.id,
              stripeSessionId: input.stripeSessionId,
              transactionId: existing.id,
            });
            const userData = await ctx.prisma.user.findUnique({
              where: { id: user.id },
              select: { credits: true },
            });
            return {
              credits: userData?.credits || 0,
              transaction: existing,
              alreadyProcessed: true,
            };
          }
        }

        // Add credits and record transaction
        const currentUser = await ctx.prisma.user.findUnique({
          where: { id: user.id },
          select: { credits: true },
        });

        const [updatedUser, transaction] = await Promise.all([
          ctx.prisma.user.update({
            where: { id: user.id },
            data: { credits: (currentUser?.credits || 0) + input.amount },
            select: { credits: true },
          }),
          ctx.prisma.billingTransaction.create({
            data: {
              userId: user.id,
              type: "purchase",
              amount: input.amount,
              reason: input.reason,
              stripeSessionId: input.stripeSessionId,
            },
          }),
        ]);

        console.log("✅ Credits added successfully:", {
          userId: user.id,
          added: input.amount,
          newTotal: updatedUser.credits,
          transactionId: transaction.id,
        });

        return {
          credits: updatedUser.credits,
          transaction,
          alreadyProcessed: false,
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("❌ Error adding credits:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add credits",
        });
      }
    }),

  // Get checkout session details
  getCheckoutSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        console.log("🔍 Getting checkout session details:", {
          sessionId: input.sessionId,
          userId: user.id,
        });

        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        // Security: only allow user to access their own session
        if (session.client_reference_id !== user.id) {
          console.error("❌ Unauthorized session access:", {
            sessionId: input.sessionId,
            requestingUserId: user.id,
            sessionUserId: session.client_reference_id,
          });
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized",
          });
        }

        console.log("✅ Checkout session retrieved:", {
          sessionId: session.id,
          status: session.payment_status,
        });

        return {
          id: session.id,
          status: session.payment_status,
          customerEmail: session.customer_email,
          metadata: session.metadata,
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("❌ Error getting checkout session:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get checkout session",
        });
      }
    }),

  // ✅ VERIFY PAYMENT (Single Source of Truth)
  // Used by frontend manual verification.
  // Checks DB -> Checks Stripe -> Reconciles if needed.
  verifyPayment: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
        try {
            const user = validateAuthContext(ctx);
            
            // 1. Check Local DB (Fast Path)
            const transaction = await ctx.prisma.billingTransaction.findFirst({
                where: { stripeSessionId: input.sessionId },
                select: { id: true, amount: true, userId: true }
            });

            if (transaction) {
                if (transaction.userId !== user.id) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
                }
                return { status: "VERIFIED", credits: transaction.amount };
            }

            // 2. Check Stripe (Authoritative Source)
            const session = await stripe.checkout.sessions.retrieve(input.sessionId);

            // Validation
            if (session.client_reference_id !== user.id) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized" });
            }

            if (session.payment_status === "paid") {
                // 3. Reconcile (Atomic Grant)
                const result = await verifyAndGrantCredits(session);

                if (result.success) {
                    return { status: "VERIFIED", credits: result.creditsAdded };
                } else {
                    console.error("❌ Verification failed logic:", result);
                    // Return specific error state if possible, or throw
                    if (result.reason === "INVALID_SESSION") {
                        throw new TRPCError({ 
                            code: "BAD_REQUEST", 
                            message: "Invalid session data or plan mismatch" 
                        });
                    }
                    // For ALREADY_PROCESSED, we technically should have returned success above or in the result check
                     if (result.reason === "ALREADY_PROCESSED") {
                        return { status: "VERIFIED", credits: result.creditsAdded };
                    }
                    
                    throw new TRPCError({ 
                        code: "INTERNAL_SERVER_ERROR", 
                        message: "Payment verification failed internally" 
                    });
                }
            }

            // 4. Pending / Failed
            return { status: "PENDING" };

        } catch (err: any) {
             if (err instanceof TRPCError) throw err;
             // Log the REAL error
             console.error("❌ VERIFY_PAYMENT_ERROR:", { 
                sessionId: input.sessionId, 
                message: err.message,
                stack: err.stack 
             });
             
             throw new TRPCError({
                 code: "INTERNAL_SERVER_ERROR",
                 message: `Verification failed: ${err.message}` // Expose error to client for debugging
             });
        }
    }),

  // Get billing history (transaction ledger)
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        console.log("🔍 Fetching billing history:", {
          userId: user.id,
          limit: input.limit,
          offset: input.offset,
        });

        // Get total count
        const totalCount = await ctx.prisma.billingTransaction.count({
          where: { userId: user.id },
        });

        // Get paginated transactions
        const transactions = await ctx.prisma.billingTransaction.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            type: true,
            amount: true,
            reason: true,
            stripeSessionId: true,
            metadata: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        });

        console.log("✅ Billing history retrieved:", {
          userId: user.id,
          count: transactions.length,
          total: totalCount,
        });

        return {
          transactions: transactions.map((t) => ({
            id: t.id,
            type: t.type as "purchase" | "deduction" | "refund",
            amount: t.amount,
            reason: t.reason,
            stripeSessionId: t.stripeSessionId,
            metadata: t.metadata as any,
            createdAt: t.createdAt.toISOString(),
          })),
          pagination: {
            total: totalCount,
            limit: input.limit,
            offset: input.offset,
            hasMore: input.offset + input.limit < totalCount,
          },
        };
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("❌ Error fetching billing history:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch billing history",
        });
      }
    }),
});
