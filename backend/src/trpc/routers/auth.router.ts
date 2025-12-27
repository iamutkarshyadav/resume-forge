import { router, publicProcedure, TRPCError } from "../trpc";
import { z } from "zod";
import {
  createSession,
  loginLocalUser,
  registerLocalUser,
  signAccessToken,
  signRefreshToken,
  verifyAndRotateRefreshToken
} from "../../services/auth.service";
import { initializeOnboarding } from "../../services/onboarding.service";
import { HttpError } from "../../utils/httpError";

const signupSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export const authRouter = router({
  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    try {
      const { firstname, lastname, email, password } = input;
      const name = `${firstname} ${lastname}`;
      const user = await registerLocalUser(email, password, name);
      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);
      await createSession(user.id, refreshToken);

      // Initialize onboarding
      // Note: This is wrapped in try-catch but will auto-create on first getStatus call if needed
      try {
        await initializeOnboarding(user.id);
      } catch (onboardingErr: any) {
        const errMsg = onboardingErr?.message || String(onboardingErr);
        console.warn(`Failed to initialize onboarding for user ${user.id} during signup: ${errMsg}`);
        // Continue - signup should succeed even if onboarding init fails
        // The onboarding record will auto-create on first status check via upsert in getOnboardingProgress
      }

      return { user, accessToken, refreshToken };
    } catch (error: any) {
      console.error("Signup error:", error?.message || error);

      if (error instanceof TRPCError) throw error;

      if (error instanceof HttpError) {
        throw new TRPCError({
          code: error.status === 409 ? "CONFLICT" :
                error.status === 400 ? "BAD_REQUEST" :
                "INTERNAL_SERVER_ERROR",
          message: error.message
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create account. Please try again."
      });
    }
  }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const user = await loginLocalUser(input.email, input.password);
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        await createSession(user.id, refreshToken);
        return { user, accessToken, refreshToken };
      } catch (error: any) {
        console.error("Login error:", error);

        if (error instanceof TRPCError) throw error;

        if (error instanceof HttpError) {
          throw new TRPCError({
            code: error.status === 401 ? "UNAUTHORIZED" :
                  error.status === 400 ? "BAD_REQUEST" :
                  "INTERNAL_SERVER_ERROR",
            message: error.message
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Login failed. Please try again."
        });
      }
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const result = await verifyAndRotateRefreshToken(input.refreshToken);
        return { accessToken: result.accessToken, refreshToken: result.refreshToken };
      } catch (error: any) {
        console.error("Refresh error:", error);

        if (error instanceof TRPCError) throw error;

        if (error instanceof HttpError) {
          throw new TRPCError({
            code: error.status === 401 ? "UNAUTHORIZED" :
                  error.status === 400 ? "BAD_REQUEST" :
                  "INTERNAL_SERVER_ERROR",
            message: error.message
          });
        }

        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session expired. Please sign in again."
        });
      }
    }),

  me: publicProcedure.query(async ({ ctx }) => {
    return ctx.user ?? null;
  })
});
