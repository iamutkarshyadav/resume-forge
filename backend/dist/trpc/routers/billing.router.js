"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.billingRouter = exports.BILLING_PLANS = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../../utils/env");
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
});
// Billing plans configuration
exports.BILLING_PLANS = [
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
exports.billingRouter = (0, trpc_1.router)({
    // Get available plans (public)
    getPlans: trpc_1.publicProcedure.query(async () => {
        return exports.BILLING_PLANS;
    }),
    // Get user's current credits
    getUserCredits: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const userData = await ctx.prisma.user.findUnique({
                where: { id: user.id },
                select: { credits: true },
            });
            if (!userData) {
                throw new trpc_1.TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }
            return {
                credits: userData.credits,
            };
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting user credits:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to get user credits",
            });
        }
    }),
    // Create Stripe checkout session
    createCheckoutSession: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        planId: zod_1.z.enum(["basic", "pro", "executive"]),
        successUrl: zod_1.z.string().url(),
        cancelUrl: zod_1.z.string().url(),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            // Get plan details
            const plan = exports.BILLING_PLANS.find((p) => p.id === input.planId);
            if (!plan) {
                throw new trpc_1.TRPCError({
                    code: "NOT_FOUND",
                    message: "Plan not found",
                });
            }
            // Create Stripe checkout session
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
                },
            });
            return {
                sessionId: session.id,
                url: session.url,
            };
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error creating checkout session:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create checkout session",
            });
        }
    }),
    // Deduct credits (protected, used by PDF download)
    deductCredits: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        amount: zod_1.z.number().int().positive(),
        reason: zod_1.z.string(),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            // Get current credits
            const userData = await ctx.prisma.user.findUnique({
                where: { id: user.id },
                select: { credits: true },
            });
            if (!userData || userData.credits < input.amount) {
                throw new trpc_1.TRPCError({
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
            return {
                credits: updatedUser.credits,
                transaction,
            };
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error deducting credits:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to deduct credits",
            });
        }
    }),
    // Add credits (for webhook use)
    addCredits: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        amount: zod_1.z.number().int().positive(),
        reason: zod_1.z.string(),
        stripeSessionId: zod_1.z.string().optional(),
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            // Check if session already processed (idempotency)
            if (input.stripeSessionId) {
                const existing = await ctx.prisma.billingTransaction.findUnique({
                    where: { stripeSessionId: input.stripeSessionId },
                });
                if (existing) {
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
            return {
                credits: updatedUser.credits,
                transaction,
                alreadyProcessed: false,
            };
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error adding credits:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to add credits",
            });
        }
    }),
    // Get checkout session details
    getCheckoutSession: trpc_1.protectedProcedure
        .input(zod_1.z.object({ sessionId: zod_1.z.string() }))
        .query(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const session = await stripe.checkout.sessions.retrieve(input.sessionId);
            // Security: only allow user to access their own session
            if (session.client_reference_id !== user.id) {
                throw new trpc_1.TRPCError({
                    code: "FORBIDDEN",
                    message: "Unauthorized",
                });
            }
            return {
                id: session.id,
                status: session.payment_status,
                customerEmail: session.customer_email,
                metadata: session.metadata,
            };
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting checkout session:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to get checkout session",
            });
        }
    }),
});
