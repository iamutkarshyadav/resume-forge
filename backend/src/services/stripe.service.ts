import Stripe from "stripe";
import { env } from "../utils/env";
import prisma from "../prismaClient";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

/**
 * Verify Stripe webhook signature
 */
export async function verifyWebhookSignature(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  let event: Stripe.Event;
  try {
    // First, parse the event to safely check livemode without verification.
    // This is safe because we are only using it to select the secret.
    const unverifiedEvent = JSON.parse(body) as Stripe.Event;

    const isLiveMode = unverifiedEvent.livemode;
    const modeLabel = isLiveMode ? "LIVE" : "TEST";

    // Determine which secret to use
    const secret = isLiveMode
      ? env.STRIPE_WEBHOOK_SECRET
      : env.STRIPE_TEST_WEBHOOK_SECRET;

    console.log(`🔐 WEBHOOK: Verifying signature for ${modeLabel} mode`, {
      mode: modeLabel,
      eventType: unverifiedEvent.type,
      eventId: unverifiedEvent.id,
      secretExists: !!secret,
      secretPrefix: secret ? secret.substring(0, 15) + "..." : "MISSING",
    });

    if (!secret) {
      const errorMsg = isLiveMode
        ? `STRIPE_WEBHOOK_SECRET is not set. Get it from Stripe Dashboard → Developers → Webhooks → [your live endpoint] → Signing secret`
        : `STRIPE_TEST_WEBHOOK_SECRET is not set. Get it from Stripe Dashboard → Developers → Webhooks → [your test endpoint] → Signing secret`;
      throw new Error(errorMsg);
    }

    // Construct the event, which also verifies the signature
    event = stripe.webhooks.constructEvent(body, signature, secret);
    console.log(`✅ WEBHOOK: Signature verified successfully for ${modeLabel} mode`, {
      mode: modeLabel,
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err: any) {
    console.error(
      `❌ WEBHOOK: Signature verification failed: ${err.message}`,
      {
        error: err.message,
        isSignatureError: err.message?.includes("Signature") || err.message?.includes("secret"),
      }
    );
    // Re-throw as a more specific error or handle as needed
    throw new Error(`Stripe webhook signature verification failed: ${err.message}`);
  }

  return event;
}

/**
 * Handle checkout.session.completed event
 * Grant credits to user after successful payment
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.client_reference_id;
  const metadata = session.metadata;

  // ✅ VALIDATION: Check required fields exist
  if (!userId || !metadata) {
    console.error("❌ WEBHOOK: Missing userId or metadata in Stripe session", {
      sessionId: session.id,
      hasUserId: !!userId,
      hasMetadata: !!metadata,
    });
    throw new Error("Invalid session metadata");
  }

  // ✅ VALIDATION: Verify session payment status
  if (session.payment_status !== "paid") {
    console.warn("⚠️ WEBHOOK: Session payment not fully paid, skipping", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });
    // Don't throw - just return silently as payment hasn't been confirmed yet
    return;
  }

  const stripeSessionId = session.id;
  const creditsToAdd = parseInt(metadata.credits || "0", 10);

  // ✅ VALIDATION: Check credits amount is positive
  if (!Number.isInteger(creditsToAdd) || creditsToAdd <= 0) {
    console.error("❌ WEBHOOK: Invalid credits amount in Stripe session", {
      sessionId: session.id,
      credits: metadata.credits,
      parsed: creditsToAdd,
    });
    throw new Error("Invalid credits amount");
  }

  // ✅ VALIDATION: Prevent unreasonably large credits
  if (creditsToAdd > 1000) {
    console.error("❌ WEBHOOK: Credits amount exceeds safety limit", {
      sessionId: session.id,
      credits: creditsToAdd,
      maxAllowed: 1000,
    });
    throw new Error("Credits amount exceeds maximum allowed");
  }

  // Check if already processed (idempotency) - FIRST CHECK
  const existingTransaction = await prisma.billingTransaction.findUnique({
    where: { stripeSessionId },
  });

  if (existingTransaction) {
    console.log("✅ WEBHOOK: Transaction already processed (idempotent)", {
      sessionId: session.id,
      transactionId: existingTransaction.id,
      creditsAdded: existingTransaction.amount,
    });
    return;
  }

  // Get current user credits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, credits: true, email: true },
  });

  if (!user) {
    console.error("❌ WEBHOOK: User not found for Stripe session", {
      userId,
      sessionId: session.id,
    });
    throw new Error("User not found");
  }

  // Re-validate credits amount from plan config
  const BILLING_PLANS = [
    { id: "basic", credits: 1 },
    { id: "pro", credits: 5 },
    { id: "executive", credits: 15 },
  ];
  const planId = metadata.planId as string;
  const plan = BILLING_PLANS.find((p) => p.id === planId);

  if (!plan || plan.credits !== creditsToAdd) {
    console.error("❌ WEBHOOK: Credits mismatch with plan config", {
      sessionId: session.id,
      planId,
      creditsInMetadata: creditsToAdd,
      creditsInConfig: plan?.credits,
    });
    throw new Error("Credits amount does not match plan");
  }

  // ✅ ADD CREDITS: Use atomic transaction to ensure consistency
  try {
    const startTime = Date.now();

    // Try using Prisma transaction first (requires MongoDB replica set)
    try {
      const result = await prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { credits: user.credits + creditsToAdd },
          select: { id: true, credits: true },
        });

        const transaction = await tx.billingTransaction.create({
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
              webhookProcessedAt: new Date().toISOString(),
            },
          },
        });

        return { updatedUser, transaction };
      });

      const duration = Date.now() - startTime;
      console.log("✅ WEBHOOK: Credits added successfully (atomic transaction)", {
        userId,
        creditsAdded: creditsToAdd,
        newTotal: result.updatedUser.credits,
        sessionId: session.id,
        transactionId: result.transaction.id,
        durationMs: duration,
        planId: metadata.planId,
      });
    } catch (txError: any) {
      // Fallback: Create transaction record FIRST (has @unique on stripeSessionId)
      // This ensures idempotency at database level, not in application code
      console.warn("⚠️ WEBHOOK: Prisma transaction not supported, using constraint-driven approach", {
        sessionId,
        error: txError.message,
      });

      let transaction;
      try {
        // Create billing transaction first - if it fails with unique constraint, already processed
        transaction = await prisma.billingTransaction.create({
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
              webhookProcessedAt: new Date().toISOString(),
            },
          },
        });
      } catch (createTxError: any) {
        // If unique constraint violation, already processed
        if (createTxError.code === 'P2002') {
          const existing = await prisma.billingTransaction.findUnique({
            where: { stripeSessionId: session.id },
          });
          if (existing) {
            console.log("✅ WEBHOOK: Transaction already processed (idempotent via constraint)", {
              transactionId: existing.id,
              sessionId: session.id,
              amount: existing.amount,
            });
            return;
          }
        }
        throw createTxError;
      }

      // Now update user AFTER transaction is guaranteed to exist in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { credits: user.credits + creditsToAdd },
        select: { id: true, credits: true },
      });

      const duration = Date.now() - startTime;
      console.log("✅ WEBHOOK: Credits added successfully (constraint-driven idempotency)", {
        userId,
        creditsAdded: creditsToAdd,
        newTotal: updatedUser.credits,
        sessionId: session.id,
        transactionId: transaction.id,
        durationMs: duration,
        planId: metadata.planId,
      });
    }
  } catch (err: any) {
    console.error("❌ WEBHOOK: Failed to add credits", {
      userId,
      sessionId,
      error: err.message,
      errorCode: err.code,
    });
    throw err;
  }
}

/**
 * Handle webhook events
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
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
