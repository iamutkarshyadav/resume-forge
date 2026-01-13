"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WebhookLogger {
    /**
     * Log webhook event received
     */
    static logEventReceived(event) {
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
    static logSignatureVerification(result, liveMode, context) {
        const mode = liveMode ? "LIVE" : "TEST";
        if (result === "success") {
            console.log(`✅ WEBHOOK: Signature verified for ${mode} mode`, {
                mode,
                eventId: context.eventId,
                eventType: context.eventType,
            });
        }
        else {
            console.error(`❌ WEBHOOK: Signature verification failed for ${mode} mode`, {
                mode,
                eventId: context.eventId,
                error: context.error,
            });
        }
    }
    /**
     * Log event processing start
     */
    static logProcessingStart(event) {
        console.log("🔄 WEBHOOK: Processing event", {
            eventId: event.id,
            eventType: event.type,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log event processing success
     */
    static logProcessingSuccess(event, durationMs) {
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
    static logProcessingFailure(event, error, durationMs) {
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
    static logCheckoutSessionStart(sessionId, userId, context = {}) {
        console.log("🔄 WEBHOOK: Processing checkout.session.completed", {
            sessionId,
            userId,
            ...context,
        });
    }
    /**
     * Log validation success
     */
    static logValidationSuccess(context) {
        console.log("✅ WEBHOOK: Session validation passed", context);
    }
    /**
     * Log validation failure
     */
    static logValidationFailure(reason, context) {
        console.error("❌ WEBHOOK: Session validation failed", {
            reason,
            ...context,
        });
    }
    /**
     * Log idempotency check
     */
    static logIdempotencyCheck(sessionId, isAlreadyProcessed, context = {}) {
        if (isAlreadyProcessed) {
            console.log("✅ WEBHOOK: Transaction already processed (idempotent)", {
                sessionId,
                ...context,
            });
        }
        else {
            console.log("ℹ️ WEBHOOK: New transaction, proceeding with processing", {
                sessionId,
                ...context,
            });
        }
    }
    /**
     * Log credits addition
     */
    static logCreditsAdded(context) {
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
    static logPaymentStatusQuery(sessionId, userId, found) {
        if (found) {
            console.log("✅ WEBHOOK: Payment confirmed via webhook", {
                sessionId,
                userId,
            });
        }
        else {
            console.log("⏳ WEBHOOK: Payment still pending", {
                sessionId,
                userId,
            });
        }
    }
    /**
     * Log duplicate prevention
     */
    static logDuplicatePrevented(sessionId, reason) {
        console.log("✅ WEBHOOK: Duplicate prevented", {
            sessionId,
            reason,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log unexpected event type
     */
    static logUnhandledEventType(eventType, eventId) {
        console.log("ℹ️ WEBHOOK: Unhandled event type (not an error)", {
            eventType,
            eventId,
        });
    }
    /**
     * Log retry attempt
     */
    static logRetryAttempt(context) {
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
    static logSecurityIssue(issue, context) {
        console.error("🚨 WEBHOOK: Security issue detected", {
            issue,
            ...context,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Log payment not yet paid (normal - webhook will retry)
     */
    static logPaymentNotPaid(sessionId, paymentStatus, context = {}) {
        console.log("ℹ️ WEBHOOK: Payment not yet paid (webhook will retry)", {
            sessionId,
            paymentStatus,
            ...context,
        });
    }
    /**
     * Create structured context for logging
     */
    static createContext(event, session) {
        const context = {
            eventId: event.id,
            eventType: event.type,
            livemode: event.livemode,
            timestamp: new Date(event.created * 1000).toISOString(),
        };
        if (session) {
            context.sessionId = session.id;
            context.userId = session.client_reference_id;
            context.paymentStatus = session.payment_status;
            context.amount = session.amount_total;
            context.currency = session.currency;
        }
        return context;
    }
}
exports.default = WebhookLogger;
