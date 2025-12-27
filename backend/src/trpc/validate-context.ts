import { TRPCError } from "@trpc/server";
import { Context } from "./context";

/**
 * Validates that a user is authenticated and has a valid ID
 * Used in protected procedures to fail fast with clear errors
 */
export function validateAuthContext(ctx: Context): { id: string; email?: string | null; name?: string | null; role?: string } {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required"
    });
  }

  if (!ctx.user.id || typeof ctx.user.id !== "string") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid user ID in authentication token"
    });
  }

  return ctx.user;
}
