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
import { createContext } from "./trpc/context";
import prisma from "./prismaClient";

import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/routers/appRouter";

const app = express();

// security
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
    } catch (err) {
      // Token was provided but invalid - let tRPC handle this
      // Don't reject here, just skip setting user
      console.warn("JWT verification failed:", (err as any)?.message);
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
