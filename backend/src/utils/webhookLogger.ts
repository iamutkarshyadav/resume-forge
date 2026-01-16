import Stripe from "stripe";

/**
 * Webhook logging utility for comprehensive event tracking
 * Provides structured logging for all webhook operations
 */

interface WebhookLogContext {
  eventId?: string;
  eventType?: string;
  sessionId?: string;
  userId?: string;
  timestamp?: string;
  durationMs?: number;
  [key: string]: any;
}

class WebhookLogger {
  /**
   * Log webhook event received
   */
  static logEventReceived(event: Stripe.Event) {
    console.log("✅ WEBHOOK: Event received", {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      mode: event.livemode ? "LIVE" : "TEST",
      timestamp: new Date(event.created * 1000).toISOString(),
    });
  }

  /**
   * Log signature verification
   */
  static logSignatureVerification(
    result: "success" | "failure",
    liveMode: boolean,
    context: WebhookLogContext
  ) {
    const mode = liveMode ? "LIVE" : "TEST";
    if (result === "success") {
      console.log(`✅ WEBHOOK: Signature verified for ${mode} mode`, {
        mode,
        eventId: context.eventId,
        eventType: context.eventType,
      });
    } else {
      console.error(
        `❌ WEBHOOK: Signature verification failed for ${mode} mode`,
        {
          mode,
          eventId: context.eventId,
          error: context.error,
        }
      );
    }
  }

  /**
   * Log event processing start
   */
  static logProcessingStart(event: Stripe.Event) {
    console.log("🔄 WEBHOOK: Processing event", {
      eventId: event.id,
      eventType: event.type,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log event processing success
   */
  static logProcessingSuccess(event: Stripe.Event, durationMs: number) {
    console.log("✅ WEBHOOK: Event processed successfully", {
      eventId: event.id,
      eventType: event.type,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log event processing failure
   */
  static logProcessingFailure(
    event: Stripe.Event,
    error: any,
    durationMs: number
  ) {
    console.error("❌ WEBHOOK: Event processing failed", {
      eventId: event.id,
      eventType: event.type,
      error: error?.message,
      durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log checkout session processing
   */
  static logCheckoutSessionStart(
    sessionId: string,
    userId: string | undefined,
    context: WebhookLogContext = {}
  ) {
    console.log("🔄 WEBHOOK: Processing checkout.session.completed", {
      sessionId,
      userId,
      ...context,
    });
  }

  /**
   * Log validation success
   */
  static logValidationSuccess(context: WebhookLogContext) {
    console.log("✅ WEBHOOK: Session validation passed", context);
  }

  /**
   * Log validation failure
   */
  static logValidationFailure(
    reason: string,
    context: WebhookLogContext
  ) {
    console.error("❌ WEBHOOK: Session validation failed", {
      reason,
      ...context,
    });
  }

  /**
   * Log idempotency check
   */
  static logIdempotencyCheck(
    sessionId: string,
    isAlreadyProcessed: boolean,
    context: WebhookLogContext = {}
  ) {
    if (isAlreadyProcessed) {
      console.log("✅ WEBHOOK: Transaction already processed (idempotent)", {
        sessionId,
        ...context,
      });
    } else {
      console.log("ℹ️ WEBHOOK: New transaction, proceeding with processing", {
        sessionId,
        ...context,
      });
    }
  }

  /**
   * Log credits addition
   */
  static logCreditsAdded(context: {
    userId: string;
    creditsAdded: number;
    previousCredits: number;
    newCredits: number;
    sessionId: string;
    transactionId: string;
    planId?: string;
    durationMs: number;
  }) {
    console.log("✅ WEBHOOK: Credits added successfully", {
      userId: context.userId,
      creditsAdded: context.creditsAdded,
      previousCredits: context.previousCredits,
      newCredits: context.newCredits,
      sessionId: context.sessionId,
      transactionId: context.transactionId,
      planId: context.planId,
      durationMs: context.durationMs,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log payment status query
   */
  static logPaymentStatusQuery(
    sessionId: string,
    userId: string,
    found: boolean
  ) {
    if (found) {
      console.log("✅ WEBHOOK: Payment confirmed via webhook", {
        sessionId,
        userId,
      });
    } else {
      console.log("⏳ WEBHOOK: Payment still pending", {
        sessionId,
        userId,
      });
    }
  }

  /**
   * Log duplicate prevention
   */
  static logDuplicatePrevented(sessionId: string, reason: string) {
    console.log("✅ WEBHOOK: Duplicate prevented", {
      sessionId,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log unexpected event type
   */
  static logUnhandledEventType(eventType: string, eventId: string) {
    console.log("ℹ️ WEBHOOK: Unhandled event type (not an error)", {
      eventType,
      eventId,
    });
  }

  /**
   * Log retry attempt
   */
  static logRetryAttempt(context: {
    sessionId: string;
    attempt: number;
    reason: string;
    nextRetryAt?: string;
  }) {
    console.warn("⚠️ WEBHOOK: Retry attempt", {
      sessionId: context.sessionId,
      attempt: context.attempt,
      reason: context.reason,
      nextRetryAt: context.nextRetryAt,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log security issue
   */
  static logSecurityIssue(issue: string, context: WebhookLogContext) {
    console.error("🚨 WEBHOOK: Security issue detected", {
      issue,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log payment not yet paid (normal - webhook will retry)
   */
  static logPaymentNotPaid(
    sessionId: string,
    paymentStatus: string,
    context: WebhookLogContext = {}
  ) {
    console.log("ℹ️ WEBHOOK: Payment not yet paid (webhook will retry)", {
      sessionId,
      paymentStatus,
      ...context,
    });
  }

  /**
   * Create structured context for logging
   */
  static createContext(
    event: Stripe.Event,
    session?: Stripe.Checkout.Session
  ): WebhookLogContext {
    const context: WebhookLogContext = {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
      timestamp: new Date(event.created * 1000).toISOString(),
    };

    if (session) {
      context.sessionId = session.id;
      context.userId = session.client_reference_id || undefined;
      context.paymentStatus = session.payment_status;
      context.amount = session.amount_total;
      context.currency = session.currency;
    }

    return context;
  }
}

export default WebhookLogger;
