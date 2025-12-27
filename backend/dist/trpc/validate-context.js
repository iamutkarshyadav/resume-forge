"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuthContext = validateAuthContext;
const server_1 = require("@trpc/server");
/**
 * Validates that a user is authenticated and has a valid ID
 * Used in protected procedures to fail fast with clear errors
 */
function validateAuthContext(ctx) {
    if (!ctx.user) {
        throw new server_1.TRPCError({
            code: "UNAUTHORIZED",
            message: "Authentication required"
        });
    }
    if (!ctx.user.id || typeof ctx.user.id !== "string") {
        throw new server_1.TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid user ID in authentication token"
        });
    }
    return ctx.user;
}
