import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import {
  createSession,
  loginLocalUser,
  registerLocalUser,
  signAccessToken,
  signRefreshToken,
  verifyAndRotateRefreshToken
} from "../../services/auth.service";

const signupSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export const authRouter = router({
  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    const { firstname, lastname, email, password } = input;
    const name = `${firstname} ${lastname}`;
    const user = await registerLocalUser(email, password, name);
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken);
    return { user, accessToken, refreshToken };
  }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ input }) => {
      const user = await loginLocalUser(input.email, input.password);
      const accessToken = signAccessToken(user.id);
      const refreshToken = signRefreshToken(user.id);
      await createSession(user.id, refreshToken);
      return { user, accessToken, refreshToken };
    }),

  refresh: publicProcedure
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      const result = await verifyAndRotateRefreshToken(input.refreshToken);
      return { accessToken: result.accessToken, refreshToken: result.refreshToken };
    }),
  me: publicProcedure.query(async ({ ctx }) => {
    const user = (ctx.req as any).user ?? null;
    return user ?? null;
  })
});
