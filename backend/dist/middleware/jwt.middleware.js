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
            return next();
        }
        if (!payload || !payload.sub)
            return next();
        // Select safe user fields (do not expose passwordHash)
        const user = await prismaClient_1.default.user.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, name: true, role: true }
        });
        if (!user)
            return next();
        req.user = user;
        return next();
    }
    catch (err) {
        console.error("JWT auth error:", err);
        return next();
    }
}
