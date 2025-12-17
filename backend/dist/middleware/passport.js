"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_github2_1 = require("passport-github2");
const env_1 = require("../utils/env");
const prismaClient_1 = __importDefault(require("../prismaClient"));
passport_1.default.serializeUser((user, done) => {
    done(null, user.id);
});
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await prismaClient_1.default.user.findUnique({ where: { id } });
        done(null, user);
    }
    catch (err) {
        done(err, null);
    }
});
async function upsertOAuthUser(params) {
    const { provider, providerId, emailFallback, displayName, accessToken, refreshToken } = params;
    const email = emailFallback;
    // Ensure a user exists for this email (or generated fallback)
    const user = await prismaClient_1.default.user.upsert({
        where: { email },
        create: { email, name: displayName ?? undefined },
        update: { name: displayName ?? undefined }
    });
    // Link or create the provider account
    await prismaClient_1.default.account.upsert({
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
    const safe = await prismaClient_1.default.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, name: true, role: true }
    });
    return safe;
}
if (env_1.env.GOOGLE_CLIENT_ID && env_1.env.GOOGLE_CLIENT_SECRET) {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: env_1.env.GOOGLE_CLIENT_ID,
        clientSecret: env_1.env.GOOGLE_CLIENT_SECRET,
        callbackURL: env_1.env.GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
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
        }
        catch (err) {
            return done(err, null);
        }
    }));
}
if (env_1.env.GITHUB_CLIENT_ID && env_1.env.GITHUB_CLIENT_SECRET) {
    passport_1.default.use(new passport_github2_1.Strategy({
        clientID: env_1.env.GITHUB_CLIENT_ID,
        clientSecret: env_1.env.GITHUB_CLIENT_SECRET,
        callbackURL: env_1.env.GITHUB_CALLBACK_URL,
        scope: ["user:email"]
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value ?? `github:${profile.id}`;
            const display = profile.displayName ?? profile.username ?? null;
            const user = await upsertOAuthUser({
                provider: "github",
                providerId: profile.id,
                emailFallback: email,
                displayName: display,
                accessToken,
                refreshToken
            });
            return done(null, user);
        }
        catch (err) {
            return done(err, null);
        }
    }));
}
exports.default = passport_1.default;
