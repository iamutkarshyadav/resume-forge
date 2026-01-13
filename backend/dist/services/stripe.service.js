"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAndGrantCredits = verifyAndGrantCredits;
exports.verifyWebhookSignature = verifyWebhookSignature;
exports.handleStripeEvent = handleStripeEvent;
const stripe_1 = __importDefault(require("stripe"));
const env_1 = require("../utils/env");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const plans_1 = require("../config/plans");
const logger_1 = require("../utils/logger");
const stripe = new stripe_1.default(env_1.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-04-10",
    typescript: true,
});
/**
 * CORE LOGIC: Verify and Grant Credits
 * This is the SINGLE source of truth for adding credits.
 * It is idempotent, atomic, and safe to call from both Webhooks and API.
 */
async function verifyAndGrantCredits(session) {
    const sessionId = session.id;
    const userId = session.client_reference_id;
    const metadata = session.metadata;
    logger_1.logger.info("CORE_PAYMENT: Starting verification", { sessionId, userId });
    // 1. Strict Validation
    if (!userId || !metadata || !metadata.planId || !metadata.credits) {
        logger_1.logger.error("CORE_PAYMENT: Partial metadata failure", { sessionId, metadata });
        return { success: false, creditsAdded: 0, reason: "INVALID_SESSION" };
    }
    if (session.payment_status !== "paid") {
        logger_1.logger.warn("CORE_PAYMENT: Session not paid", { sessionId, status: session.payment_status });
        return { success: false, creditsAdded: 0, reason: "INVALID_SESSION" };
    }
    const creditsToAdd = parseInt(metadata.credits, 10);
    const planId = metadata.planId;
    // Validate Plan Logic
    const plan = plans_1.BILLING_PLANS.find(p => p.id === planId);
    if (!plan || plan.credits !== creditsToAdd) {
        logger_1.logger.error("CORE_PAYMENT: Plan mismatch (possible tampering)", { sessionId, planId, creditsToAdd });
        return { success: false, creditsAdded: 0, reason: "INVALID_SESSION" };
    }
    // 2. Idempotency Check (Fast Path)
    const existingTx = await prismaClient_1.default.billingTransaction.findFirst({
        where: { stripeSessionId: sessionId }
    });
    if (existingTx) {
        logger_1.logger.info("CORE_PAYMENT: Idempotent hit - already processed", { sessionId, txId: existingTx.id });
        return {
            success: true,
            creditsAdded: existingTx.amount,
            transactionId: existingTx.id,
            reason: "ALREADY_PROCESSED"
        };
    }
    // 3. Atomic Write
    try {
        const result = await prismaClient_1.default.$transaction(async (tx) => {
            // Re-check inside transaction (for high concurrency)
            const doubleCheck = await tx.billingTransaction.findFirst({
                where: { stripeSessionId: sessionId }
            });
            if (doubleCheck)
                return { tx: doubleCheck, existing: true };
            // Create Transaction Record
            const newTx = await tx.billingTransaction.create({
                data: {
                    userId: userId,
                    type: "purchase",
                    amount: creditsToAdd,
                    reason: `purchase_session_${sessionId}`,
                    stripeSessionId: sessionId,
                    metadata: {
                        planId,
                        currency: session.currency,
                        amountTotal: session.amount_total,
                        userEmail: session.customer_email
                    }
                }
            });
            // Update User Credits
            await tx.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: creditsToAdd }
                }
            });
            return { tx: newTx, existing: false };
        });
        logger_1.logger.info("CORE_PAYMENT: Transaction successful", {
            sessionId,
            txId: result.tx.id,
            creditsAdded: creditsToAdd,
            isNew: !result.existing
        });
        return {
            success: true,
            creditsAdded: creditsToAdd,
            transactionId: result.tx.id,
            reason: result.existing ? "ALREADY_PROCESSED" : "SUCCESS"
        };
    }
    catch (error) {
        // Handle constrained failure (race condition)
        if (error.code === 'P2002') {
            logger_1.logger.info("CORE_PAYMENT: Idempotent hit via constraint", { sessionId });
            // Fetch the winner's record to return consistent data
            const winner = await prismaClient_1.default.billingTransaction.findFirst({
                where: { stripeSessionId: sessionId }
            });
            return {
                success: true,
                creditsAdded: winner?.amount || 0,
                transactionId: winner?.id,
                reason: "ALREADY_PROCESSED"
            };
        }
        logger_1.logger.error("CORE_PAYMENT: CRITICAL TRANSACTION FAILURE", { sessionId, error: error.message });
        throw new Error("Payment processing failed internally");
    }
}
/**
 * Webhook Handler - Wrapper around Core Logic
 */
async function verifyWebhookSignature(body, signature) {
    const isLive = env_1.env.NODE_ENV === "production";
    const secret = isLive ? env_1.env.STRIPE_WEBHOOK_SECRET : env_1.env.STRIPE_TEST_WEBHOOK_SECRET;
    if (!secret)
        throw new Error("Missing Stripe Webhook Secret");
    try {
        return stripe.webhooks.constructEvent(body, signature, secret);
    }
    catch (err) {
        logger_1.logger.error("WEBHOOK: Signature failed", { error: err.message });
        throw new Error(`Webhook Error: ${err.message}`);
    }
}
async function handleStripeEvent(event) {
    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        await verifyAndGrantCredits(session);
    }
}
