import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { env } from "../utils/env";
import prisma from "../prismaClient";

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true }
    });
    done(null, user);
  } catch (err) {
    done(err as Error, null);
  }
});

async function upsertOAuthUser(params: {
  provider: "google" | "github";
  providerId: string;
  emailFallback: string;
  displayName?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  const { provider, providerId, emailFallback, displayName, accessToken, refreshToken } = params;
  const email = emailFallback;

  // Ensure a user exists for this email (or generated fallback)
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name: displayName ?? undefined },
    update: { name: displayName ?? undefined }
  });

  // Link or create the provider account
  await prisma.account.upsert({
    where: { provider_providerId: { provider, providerId } },
    create: {
      provider,
      providerId,
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined,
      userId: user.id
    },
    update: {
      accessToken: accessToken ?? undefined,
      refreshToken: refreshToken ?? undefined,
      userId: user.id
    }
  });

  // Return safe user fields only
  const safe = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true }
  });
  return safe as any;
}

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? `google:${profile.id}`;
          const user = await upsertOAuthUser({
            provider: "google",
            providerId: profile.id,
            emailFallback: email,
            displayName: profile.displayName ?? null,
            accessToken,
            refreshToken
          });
          return done(null, user);
        } catch (err) {
          return done(err as Error, null);
        }
      }
    )
  );
}

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: env.GITHUB_CALLBACK_URL,
        scope: ["user:email"]
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? `github:${profile.id}`;
          const display = (profile as any).displayName ?? (profile as any).username ?? null;
          const user = await upsertOAuthUser({
            provider: "github",
            providerId: profile.id,
            emailFallback: email,
            displayName: display,
            accessToken,
            refreshToken
          });
          return done(null, user);
        } catch (err) {
          return done(err as Error, null);
        }
      }
    )
  );
}

export default passport;
