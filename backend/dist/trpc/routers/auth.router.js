"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const auth_service_1 = require("../../services/auth.service");
const onboarding_service_1 = require("../../services/onboarding.service");
const httpError_1 = require("../../utils/httpError");
const signupSchema = zod_1.z.object({
    firstname: zod_1.z.string().min(1),
    lastname: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8)
});
exports.authRouter = (0, trpc_1.router)({
    signup: trpc_1.publicProcedure.input(signupSchema).mutation(async ({ input }) => {
        try {
            const { firstname, lastname, email, password } = input;
            const name = `${firstname} ${lastname}`;
            const user = await (0, auth_service_1.registerLocalUser)(email, password, name);
            const accessToken = (0, auth_service_1.signAccessToken)(user.id);
            const refreshToken = (0, auth_service_1.signRefreshToken)(user.id);
            await (0, auth_service_1.createSession)(user.id, refreshToken);
            // Initialize onboarding
            // Note: This is wrapped in try-catch but will auto-create on first getStatus call if needed
            try {
                await (0, onboarding_service_1.initializeOnboarding)(user.id);
            }
            catch (onboardingErr) {
                const errMsg = onboardingErr?.message || String(onboardingErr);
                console.warn(`Failed to initialize onboarding for user ${user.id} during signup: ${errMsg}`);
                // Continue - signup should succeed even if onboarding init fails
                // The onboarding record will auto-create on first status check via upsert in getOnboardingProgress
            }
            return { user, accessToken, refreshToken };
        }
        catch (error) {
            console.error("Signup error:", error?.message || error);
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 409 ? "CONFLICT" :
                        error.status === 400 ? "BAD_REQUEST" :
                            "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to create account. Please try again."
            });
        }
    }),
    login: trpc_1.publicProcedure
        .input(zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        try {
            const user = await (0, auth_service_1.loginLocalUser)(input.email, input.password);
            const accessToken = (0, auth_service_1.signAccessToken)(user.id);
            const refreshToken = (0, auth_service_1.signRefreshToken)(user.id);
            await (0, auth_service_1.createSession)(user.id, refreshToken);
            return { user, accessToken, refreshToken };
        }
        catch (error) {
            console.error("Login error:", error);
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 401 ? "UNAUTHORIZED" :
                        error.status === 400 ? "BAD_REQUEST" :
                            "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Login failed. Please try again."
            });
        }
    }),
    refresh: trpc_1.publicProcedure
        .input(zod_1.z.object({ refreshToken: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        try {
            const result = await (0, auth_service_1.verifyAndRotateRefreshToken)(input.refreshToken);
            return { accessToken: result.accessToken, refreshToken: result.refreshToken };
        }
        catch (error) {
            console.error("Refresh error:", error);
            if (error instanceof trpc_1.TRPCError)
                throw error;
            if (error instanceof httpError_1.HttpError) {
                throw new trpc_1.TRPCError({
                    code: error.status === 401 ? "UNAUTHORIZED" :
                        error.status === 400 ? "BAD_REQUEST" :
                            "INTERNAL_SERVER_ERROR",
                    message: error.message
                });
            }
            throw new trpc_1.TRPCError({
                code: "UNAUTHORIZED",
                message: "Session expired. Please sign in again."
            });
        }
    }),
    me: trpc_1.publicProcedure.query(async ({ ctx }) => {
        return ctx.user ?? null;
    })
});
