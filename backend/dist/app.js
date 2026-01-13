"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("./middleware/passport"));
const logger_1 = require("./utils/logger");
const rate_middleware_1 = require("./middleware/rate.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const env_1 = require("./utils/env");
const restFile_controller_1 = require("./controller/restFile.controller");
const jd_controller_1 = require("./controller/jd.controller");
const jwt_middleware_1 = require("./middleware/jwt.middleware");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const stripe_service_1 = require("./services/stripe.service");
const context_1 = require("./trpc/context");
const prismaClient_1 = __importDefault(require("./prismaClient"));
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const appRouter_1 = require("./trpc/routers/appRouter");
const app = (0, express_1.default)();
// security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(logger_1.morganMiddleware);
app.use(rate_middleware_1.apiRateLimiter);
app.use(passport_1.default.initialize());
// Serve uploads
const uploadDir = env_1.env.UPLOAD_DIR;
if (!fs_1.default.existsSync(uploadDir))
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express_1.default.static(path_1.default.resolve(uploadDir)));
// Basic health
app.get("/api/v1/health", (req, res) => res.json({ ok: true, env: env_1.env.NODE_ENV }));
/**
 * OAuth routes (express)
 */
app.get("/api/v1/auth/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
app.get("/api/v1/auth/google/callback", passport_1.default.authenticate("google", { session: false, failureRedirect: "/api/v1/auth/failure" }), async (req, res) => {
    // user is req.user
    const { signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
    const user = req.user;
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
    // redirect or return JSON
    res.json({ accessToken, refreshToken, user });
});
app.get("/api/v1/auth/github", passport_1.default.authenticate("github", { scope: ["user:email"] }));
app.get("/api/v1/auth/github/callback", passport_1.default.authenticate("github", { session: false, failureRedirect: "/api/v1/auth/failure" }), async (req, res) => {
    const { signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
    const user = req.user;
    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);
    await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
    res.json({ accessToken, refreshToken, user });
});
app.get("/api/v1/auth/failure", (req, res) => {
    res.status(401).json({ error: "OAuth failed" });
});
// REST file upload endpoint (protected)
app.post("/api/v1/files/upload", jwt_middleware_1.jwtAuth, restFile_controller_1.uploadResumeHandler);
// Local auth routes
app.post("/api/v1/auth/register", express_1.default.json(), async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "email and password required" });
        const { registerLocalUser, signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
        const user = await registerLocalUser(email, password, name);
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
        res.json({ accessToken, refreshToken, user });
    }
    catch (err) {
        next(err);
    }
});
app.post("/api/v1/auth/login", express_1.default.json(), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: "email and password required" });
        const { loginLocalUser, signAccessToken, signRefreshToken, createSession } = require("./services/auth.service");
        const user = await loginLocalUser(email, password);
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);
        await createSession(user.id, refreshToken, req.ip, req.headers["user-agent"]?.toString());
        res.json({ accessToken, refreshToken, user });
    }
    catch (err) {
        next(err);
    }
});
app.post("/api/v1/auth/refresh", express_1.default.json(), async (req, res, next) => {
    try {
        const { refreshToken } = req.body || {};
        if (!refreshToken || typeof refreshToken !== "string") {
            return res.status(400).json({ error: "refreshToken is required" });
        }
        const { verifyAndRotateRefreshToken } = require("./services/auth.service");
        const result = await verifyAndRotateRefreshToken(refreshToken);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// ✅ Stripe webhook (raw body, no JSON parsing)
// This endpoint is the source of truth for payment confirmation
// NOTE: Must stay BEFORE express.json/urlencoded registration to preserve raw body
app.post("/api/v1/stripe/webhook", express_1.default.raw({ type: "application/json" }), async (req, res) => {
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
        const rawBody = req.body;
        // ✅ STEP 1: Extract signature
        const signature = req.headers["stripe-signature"];
        if (!signature) {
            console.error("❌ WEBHOOK: Missing stripe-signature header", { headers: Object.keys(req.headers) });
            return res.status(400).json({ error: "Missing stripe signature" });
        }
        // ✅ STEP 2: Verify signature
        let event;
        try {
            event = await (0, stripe_service_1.verifyWebhookSignature)(rawBody, signature);
            console.log("✅ WEBHOOK: Signature verified for event", {
                eventId: event.id,
                eventType: event.type,
                livemode: event.livemode,
                timestamp: event.created,
            });
        }
        catch (err) {
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
        (0, stripe_service_1.handleStripeEvent)(event)
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
            .catch((err) => {
            const duration = Date.now() - webhookStartTime;
            const checkoutSessionId = event?.type === "checkout.session.completed" ? event?.data?.object?.id : undefined;
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
    }
    catch (err) {
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// REST JD + match endpoints
app.post("/api/v1/jd", jwt_middleware_1.jwtAuth, express_1.default.json(), jd_controller_1.createJDTextHandler);
app.post("/api/v1/jd/upload", jwt_middleware_1.jwtAuth, jd_controller_1.uploadJDHandler); // always rejects
app.post("/api/v1/match/analyze", jwt_middleware_1.jwtAuth, express_1.default.json(), jd_controller_1.analyzeHandler);
app.post("/api/v1/match/generate", jwt_middleware_1.jwtAuth, express_1.default.json(), jd_controller_1.generateHandler);
app.get("/api/v1/match/:id", jwt_middleware_1.jwtAuth, jd_controller_1.getMatchHandler);
// Lightweight middleware to populate user from JWT (without rejecting)
// This allows tRPC public/protected procedures to handle auth themselves
const populateUserFromJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return next();
        const parts = authHeader.split(" ").filter(Boolean);
        const token = parts.length === 1 ? parts[0] : parts[1];
        if (!token)
            return next();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_TOKEN_SECRET);
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                console.info(`JWT Expired: ${token.substring(0, 10)}...`);
            }
            else if (err.name === 'JsonWebTokenError') {
                console.warn(`JWT Invalid: ${err.message}`);
            }
            else {
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
            const user = await prismaClient_1.default.user.findUnique({
                where: { id: payload.sub },
                select: { id: true, email: true, name: true, role: true }
            });
            if (user) {
                req.user = user;
            }
        }
        catch (err) {
            // DB error - don't reject, let tRPC handle
            console.error("Error fetching user:", err?.message);
        }
        return next();
    }
    catch (err) {
        // Unexpected error - don't reject, let request proceed
        console.error("populateUserFromJWT middleware error:", err?.message || err);
        return next();
    }
};
// tRPC handler - uses lightweight middleware that populates user but doesn't reject
app.use("/api/v1/trpc", populateUserFromJWT, trpcExpress.createExpressMiddleware({
    router: appRouter_1.appRouter,
    createContext: context_1.createContext
}));
app.use(error_middleware_1.errorHandler);
exports.default = app;
