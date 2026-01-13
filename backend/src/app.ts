import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import passport from "./middleware/passport";
import { morganMiddleware } from "./utils/logger";
import { apiRateLimiter } from "./middleware/rate.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { env } from "./utils/env";
import { uploadResumeHandler } from "./controller/restFile.controller";
import { uploadJDHandler, analyzeHandler, generateHandler, getMatchHandler, createJDTextHandler } from "./controller/jd.controller";
import { jwtAuth } from "./middleware/jwt.middleware";
import path from "path";
import fs from "fs";
import { handleStripeEvent, verifyWebhookSignature } from "./services/stripe.service";
import { createContext } from "./trpc/context";
import prisma from "./prismaClient";

import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/routers/appRouter";

const app = express();

// security
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(morganMiddleware);
app.use(apiRateLimiter);
app.use(passport.initialize());

// Serve uploads
const uploadDir = env.UPLOAD_DIR;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.resolve(uploadDir)));

// Basic health
app.get("/api/v1/health", (req, res) => res.json({ ok: true, env: env.NODE_ENV }));

/**
 * OAuth routes (express)
 */

app.get("/api/v1/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/api/v1/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/api/v1/auth/failure" }),
  async (req: any, res) => {
    // user is req.user
    const { signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
    const user = req.user;
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
    // redirect or return JSON
    res.json({ accessToken, refreshToken, user });
  }
);

app.get("/api/v1/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
app.get(
  "/api/v1/auth/github/callback",
  passport.authenticate("github", { session: false, failureRedirect: "/api/v1/auth/failure" }),
  async (req: any, res) => {
    const { signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
    const user = req.user;
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
    res.json({ accessToken, refreshToken, user });
  }
);

app.get("/api/v1/auth/failure", (req, res) => {
  res.status(401).json({ error: "OAuth failed" });
});

// REST file upload endpoint (protected)
app.post("/api/v1/files/upload", jwtAuth, uploadResumeHandler);

// Local auth routes
app.post("/api/v1/auth/register", express.json(), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const { registerLocalUser, signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
    const user = await registerLocalUser(email, password, name);
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/auth/login", express.json(), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const { loginLocalUser, signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
    const user = await loginLocalUser(email, password);
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
    res.json({ accessToken, refreshToken, user });
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/auth/refresh", express.json(), async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ error: "refreshToken is required" });
    }
    const { verifyAndRotateRefreshToken } = require("./services/auth.service");
    const result = await verifyAndRotateRefreshToken(refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ✅ Stripe webhook (raw body, no JSON parsing)
// This endpoint is the source of truth for payment confirmation
// NOTE: Must stay BEFORE express.json/urlencoded registration to preserve raw body
app.post("/api/v1/stripe/webhook", express.raw({ type: "application/json" }), async (req: any, res) => {
  const webhookStartTime = Date.now();

  try {
    // Validate body is still a Buffer (express.json must not have run)
    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ WEBHOOK: Invalid body type for Stripe webhook", {
        receivedType: typeof req.body,
        isBuffer: Buffer.isBuffer(req.body),
        contentKeys: req.body && typeof req.body === "object" ? Object.keys(req.body) : undefined,
      });
      return res.status(400).json({ error: "Webhook payload must be sent as raw bytes" });
    }
    const rawBody = req.body as Buffer;

    // ✅ STEP 1: Extract signature
    const signature = req.headers["stripe-signature"];
    if (!signature) {
      console.error("❌ WEBHOOK: Missing stripe-signature header", { headers: Object.keys(req.headers) });
      return res.status(400).json({ error: "Missing stripe signature" });
    }

    // ✅ STEP 2: Verify signature
    let event: any;
    try {
      event = await verifyWebhookSignature(rawBody, signature);
      console.log("✅ WEBHOOK: Signature verified for event", {
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode,
        timestamp: event.created,
      });
    } catch (err: any) {
      const statusCode = err?.statusCode ?? 400;
      console.error("❌ WEBHOOK: Signature verification failed:", {
        error: err.message,
        signaturePrefix: signature.substring(0, 20) + "...",
        bodyLength: rawBody.length,
        statusCode,
      });
      return res.status(statusCode).json({ error: err.message || "Signature verification failed" });
    }

    // ✅ STEP 3: Return 200 to acknowledge receipt immediately
    res.status(200).json({ received: true, eventId: event.id });

    // ✅ STEP 4: Process event asynchronously without blocking the response
    handleStripeEvent(event)
      .then(() => {
        const duration = Date.now() - webhookStartTime;
        console.log("✅ WEBHOOK: Event processed successfully (asynchronous)", {
          eventId: event.id,
          eventType: event.type,
          stripeSessionId: event?.data?.object?.id,
          durationMs: duration,
          timestamp: new Date().toISOString(),
        });
      })
      .catch((err: any) => {
        const duration = Date.now() - webhookStartTime;
        const checkoutSessionId =
          event?.type === "checkout.session.completed" ? (event?.data as any)?.object?.id : undefined;

        console.error("❌ WEBHOOK: Asynchronous event processing failed:", {
          eventId: event.id,
          eventType: event.type,
          stripeSessionId: checkoutSessionId,
          error: err.message,
          durationMs: duration,
          stack: err.stack?.substring(0, 500),
        });
        // No need to return 500 here as we've already responded to Stripe
        // Log the error for internal monitoring
      });
  } catch (err: any) {
    const duration = Date.now() - webhookStartTime;

    console.error("❌ WEBHOOK: Unexpected error in webhook handler:", {
      error: err.message,
      durationMs: duration,
      stack: err.stack?.substring(0, 500),
    });

    // ✅ Return 500 for unexpected errors so Stripe retries
    return res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
});

// JSON parsers MUST be registered after the raw webhook route so the webhook keeps its Buffer body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// REST JD + match endpoints
app.post("/api/v1/jd", jwtAuth, express.json(), createJDTextHandler);
app.post("/api/v1/jd/upload", jwtAuth, uploadJDHandler); // always rejects
app.post("/api/v1/match/analyze", jwtAuth, express.json(), analyzeHandler);
app.post("/api/v1/match/generate", jwtAuth, express.json(), generateHandler);
app.get("/api/v1/match/:id", jwtAuth, getMatchHandler);

// Lightweight middleware to populate user from JWT (without rejecting)
// This allows tRPC public/protected procedures to handle auth themselves
const populateUserFromJWT = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next();

    const parts = authHeader.split(" ").filter(Boolean);
    const token = parts.length === 1 ? parts[0] : parts[1];
    if (!token) return next();

    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_TOKEN_SECRET) as { sub: string; iat: number; exp: number };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        console.info(`JWT Expired: ${token.substring(0, 10)}...`);
      } else if (err.name === 'JsonWebTokenError') {
        console.warn(`JWT Invalid: ${err.message}`);
      } else {
        console.error(`JWT Error: ${err.message}`);
      }
      // Token was provided but invalid - let tRPC handle this (it will see no user)
      return next();
    }

    if (!payload || !payload.sub) {
      console.warn("JWT payload missing or invalid");
      return next();
    }

    // Populate user if token is valid
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true }
      });

      if (user) {
        req.user = user;
      }
    } catch (err) {
      // DB error - don't reject, let tRPC handle
      console.error("Error fetching user:", (err as any)?.message);
    }

    return next();
  } catch (err: any) {
    // Unexpected error - don't reject, let request proceed
    console.error("populateUserFromJWT middleware error:", err?.message || err);
    return next();
  }
};

// tRPC handler - uses lightweight middleware that populates user but doesn't reject
app.use(
  "/api/v1/trpc",
  populateUserFromJWT,
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext
  })
);

app.use(errorHandler);

export default app;
