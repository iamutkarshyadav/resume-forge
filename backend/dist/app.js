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
const passport_1 = __importDefault(require("./middleware/passport"));
const logger_1 = require("./utils/logger");
const rate_middleware_1 = require("./middleware/rate.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const env_1 = require("./utils/env");
const restFile_controller_1 = require("./controller/restFile.controller");
const jwt_middleware_1 = require("./middleware/jwt.middleware");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const context_1 = require("./trpc/context");
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const appRouter_1 = require("./trpc/routers/appRouter");
const app = (0, express_1.default)();
// security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
// tRPC handler
app.use("/api/v1/trpc", trpcExpress.createExpressMiddleware({
    router: appRouter_1.appRouter,
    createContext: context_1.createContext
}));
app.use(error_middleware_1.errorHandler);
exports.default = app;
