"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuth = jwtAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../utils/env");
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function jwtAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return next();
        // Accept formats: "Bearer <token>" or raw token
        const parts = authHeader.split(" ").filter(Boolean);
        const token = parts.length === 1 ? parts[0] : parts[1];
        if (!token)
            return next();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_TOKEN_SECRET);
        }
        catch (err) {
            console.warn("JWT verification failed:", err?.message);
            // Don't call next() - token was provided but invalid
            return res.status(401).json({ message: "Invalid or expired token" });
        }
        if (!payload || !payload.sub) {
            console.warn("JWT payload missing or invalid");
            // Token was provided but payload is invalid
            return res.status(401).json({ message: "Invalid token payload" });
        }
        // Select safe user fields (do not expose passwordHash)
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, name: true, role: true }
        });
        if (!user) {
            console.warn(`User not found for JWT sub: ${payload.sub}`);
            // Token was valid but user doesn't exist
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        return next();
    }
    catch (err) {
        console.error("JWT auth middleware error:", err?.message || err);
        return res.status(500).json({ message: "Authentication error" });
    }
}
