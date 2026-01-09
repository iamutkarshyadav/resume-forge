"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.handleCheckoutSessionCompleted = handleCheckoutSessionCompleted;
exports.handleStripeEvent = handleStripeEvent;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../utils/env");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
});
/**
 * Verify Stripe webhook signature
 */
async function verifyWebhookSignature(body, signature) {
    return stripe.webhooks.constructEvent(body, signature, env_1.env.STRIPE_WEBHOOK_SECRET);
}
/**
 * Handle checkout.session.completed event
 * Grant credits to user after successful payment
 */
async function handleCheckoutSessionCompleted(session) {
    const userId = session.client_reference_id;
    const metadata = session.metadata;
    if (!userId || !metadata) {
        console.error("Missing userId or metadata in Stripe session", {
            sessionId: session.id,
        });
        throw new Error("Invalid session metadata");
    }
    const stripeSessionId = session.id;
    const creditsToAdd = parseInt(metadata.credits || "0", 10);
    if (creditsToAdd <= 0) {
        console.error("Invalid credits amount in Stripe session", {
            sessionId: session.id,
            credits: metadata.credits,
        });
        throw new Error("Invalid credits amount");
    }
    // Check if already processed (idempotency)
    const existingTransaction = await prismaClient_1.default.billingTransaction.findUnique({
        where: { stripeSessionId },
    });
    if (existingTransaction) {
        console.log("Transaction already processed", {
            sessionId: session.id,
            transactionId: existingTransaction.id,
        });
        return;
    }
    // Get current user credits
    const user = await prismaClient_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, credits: true, email: true },
    });
    if (!user) {
        console.error("User not found for Stripe session", {
            userId,
            sessionId: session.id,
        });
        throw new Error("User not found");
    }
    // Add credits and record transaction
    try {
        await Promise.all([
            prismaClient_1.default.user.update({
                where: { id: userId },
                data: { credits: user.credits + creditsToAdd },
            }),
            prismaClient_1.default.billingTransaction.create({
                data: {
                    userId,
                    type: "purchase",
                    amount: creditsToAdd,
                    reason: `stripe_checkout_${session.id}`,
                    stripeSessionId: session.id,
                    metadata: {
                        planId: metadata.planId,
                        amount: session.amount_total,
                        currency: session.currency,
                        customerEmail: session.customer_email,
                    },
                },
            }),
        ]);
        console.log("Credits added successfully", {
            userId,
            creditsAdded: creditsToAdd,
            newTotal: user.credits + creditsToAdd,
            sessionId: session.id,
        });
    }
    catch (error) {
        console.error("Error processing Stripe webhook", {
            userId,
            sessionId: session.id,
            error,
        });
        throw error;
    }
}
/**
 * Handle webhook events
 */
async function handleStripeEvent(event) {
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object;
            await handleCheckoutSessionCompleted(session);
            break;
        case "charge.failed":
            console.warn("Charge failed", {
                eventId: event.id,
                charge: event.data.object,
            });
            break;
        case "charge.refunded":
            console.log("Charge refunded", {
                eventId: event.id,
                charge: event.data.object,
            });
            // Could implement refund logic here
            break;
        default:
            console.log("Unhandled Stripe event type", event.type);
    }
}
