import { router, publicProcedure, protectedProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import { validateAuthContext } from "../validate-context";
import Stripe from "stripe";
import { env } from "../../utils/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

// Billing plans configuration
export const BILLING_PLANS = [
  {
    id: "basic",
    name: "Basic",
    description: "1 PDF Download",
    price: 999, // $9.99 in cents
    credits: 1,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "5 PDF Downloads",
    price: 2499, // $24.99 in cents
    credits: 5,
    popular: true,
  },
  {
    id: "executive",
    name: "Executive",
    description: "15 PDF Downloads",
    price: 4999, // $49.99 in cents
    credits: 15,
    popular: false,
  },
];

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
        console.error("❌ User not found:", user.id);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      console.log("✅ Retrieved user credits:", {
        userId: user.id,
        credits: userData.credits,
      });

      return {
        credits: userData.credits,
      };
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      console.error("❌ Error getting user credits:", err);
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
        idempotencyKey: z.string().uuid().optional(), // ✅ For frontend idempotency
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
          success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: input.cancelUrl,
          client_reference_id: user.id,
          metadata: {
            userId: user.id,
            planId: input.planId,
            credits: plan.credits.toString(),
            idempotencyKey: input.idempotencyKey, // ✅ Track frontend idempotency
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
          const existing = await ctx.prisma.billingTransaction.findUnique({
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

  // ✅ NEW: Check payment status from local DB (NOT Stripe)
  // This is the source of truth for payment confirmation
  getPaymentStatus: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        const user = validateAuthContext(ctx);

        console.log("🔍 Payment status check:", {
          sessionId: input.sessionId,
          userId: user.id,
        });

        // ✅ Query LOCAL database, not Stripe
        // If webhook has processed, BillingTransaction will exist
        const transaction = await ctx.prisma.billingTransaction.findUnique({
          where: { stripeSessionId: input.sessionId },
          select: {
            id: true,
            amount: true,
            createdAt: true,
            userId: true,
          },
        });

        if (transaction) {
          // ✅ Webhook has processed, credits are confirmed
          // Verify transaction belongs to current user
          if (transaction.userId !== user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Transaction does not belong to current user",
            });
          }

          console.log("✅ Payment confirmed via webhook:", {
            sessionId: input.sessionId,
            transactionId: transaction.id,
            creditsAdded: transaction.amount,
          });

          return {
            status: "confirmed" as const,
            creditsAdded: transaction.amount,
            processedAt: transaction.createdAt.toISOString(),
            transactionId: transaction.id,
          };
        } else {
          // ⏳ Webhook not processed yet
          console.log("⏳ Payment still pending:", {
            sessionId: input.sessionId,
            userId: user.id,
          });

          return {
            status: "pending" as const,
            creditsAdded: 0,
          };
        }
      } catch (err: any) {
        if (err instanceof TRPCError) throw err;
        console.error("❌ Error checking payment status:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check payment status",
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
