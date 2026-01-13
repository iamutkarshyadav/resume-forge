import { HttpError } from "../utils/httpError";
import { logger } from "../utils/logger";

// In-memory rate limiter for short-term burst protection
// This prevents accidental rapid clicking / infinite loops
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if user can make an AI request (short-term rate limiting)
 * @param userId User ID
 * @param operationType Type of operation (analyze, generate)
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds
 * @returns true if allowed, throws HttpError if rate limited
 */
export function checkAIRateLimit(
  userId: string,
  operationType: "analyze" | "generate",
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute default
): void {
  const key = `${userId}:${operationType}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  // If no entry or expired, create new entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs
    };
    rateLimitStore.set(key, entry);
    return; // Allow request
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > maxRequests) {
    const resetIn = Math.ceil((entry.resetAt - now) / 1000);
    logger.warn("AI rate limit exceeded", { userId, operationType, count: entry.count, resetIn });
    throw new HttpError(
      429,
      `Too many ${operationType} requests. Please wait ${resetIn} seconds before trying again.`
    );
  }
  
  // Update entry
  rateLimitStore.set(key, entry);
}

/**
 * Get remaining requests for a user
 * @param userId User ID
 * @param operationType Type of operation
 * @returns Remaining requests in current window
 */
export function getRemainingRequests(
  userId: string,
  operationType: "analyze" | "generate"
): number {
  const key = `${userId}:${operationType}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry || entry.resetAt < Date.now()) {
    return 5; // Default max
  }
  
  return Math.max(0, 5 - entry.count);
}
