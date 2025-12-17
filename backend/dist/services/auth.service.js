"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.createSession = createSession;
exports.verifyAndRotateRefreshToken = verifyAndRotateRefreshToken;
exports.registerLocalUser = registerLocalUser;
exports.loginLocalUser = loginLocalUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../utils/env");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const date_fns_1 = require("date-fns");
const bcryptjs_1 = require("bcryptjs");
const httpError_1 = require("../utils/httpError");
function parseExpiryToDate(base, expr) {
    const m = expr.match(/^(\d+)([smhd])$/i);
    if (!m)
        return (0, date_fns_1.add)(base, { days: 30 });
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    if (unit === "s")
        return (0, date_fns_1.add)(base, { seconds: n });
    if (unit === "m")
        return (0, date_fns_1.add)(base, { minutes: n });
    if (unit === "h")
        return (0, date_fns_1.add)(base, { hours: n });
    return (0, date_fns_1.add)(base, { days: n });
}
// ------------------------------------
// ACCESS TOKEN
// ------------------------------------
function signAccessToken(userId) {
    return jsonwebtoken_1.default.sign({}, env_1.env.JWT_ACCESS_TOKEN_SECRET, {
        subject: userId,
        expiresIn: env_1.env.JWT_ACCESS_TOKEN_EXPIRES_IN
    });
}
// ------------------------------------
// REFRESH TOKEN
// ------------------------------------
function signRefreshToken(userId) {
    return jsonwebtoken_1.default.sign({}, env_1.env.JWT_REFRESH_TOKEN_SECRET, {
        subject: userId,
        expiresIn: env_1.env.JWT_REFRESH_TOKEN_EXPIRES_IN
    });
}
// ------------------------------------
// CREATE SESSION (stores hashed refresh token)
// ------------------------------------
async function createSession(userId, refreshToken, _ip, _userAgent) {
    const tokenHash = await (0, bcryptjs_1.hash)(refreshToken, 10);
    const expiresAt = parseExpiryToDate(new Date(), env_1.env.JWT_REFRESH_TOKEN_EXPIRES_IN);
    await prismaClient_1.default.refreshToken.create({
        data: {
            tokenHash,
            userId,
            expiresAt
        }
    });
}
async function verifyAndRotateRefreshToken(oldToken) {
    try {
        const payload = jsonwebtoken_1.default.verify(oldToken, env_1.env.JWT_REFRESH_TOKEN_SECRET);
        const userId = payload.sub;
        const tokens = await prismaClient_1.default.refreshToken.findMany({
            where: { userId, revoked: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: "desc" }
        });
        let matchedId = null;
        for (const t of tokens) {
            const ok = await (0, bcryptjs_1.compare)(oldToken, t.tokenHash);
            if (ok) {
                matchedId = t.id;
                break;
            }
        }
        if (!matchedId)
            throw new Error("Refresh token not recognized");
        await prismaClient_1.default.refreshToken.update({ where: { id: matchedId }, data: { revoked: true } });
        const newRefresh = signRefreshToken(userId);
        await createSession(userId, newRefresh);
        const accessToken = signAccessToken(userId);
        return { userId, accessToken, refreshToken: newRefresh };
    }
    catch (e) {
        throw new Error("Invalid refresh token");
    }
}
// ------------------------------------
// REGISTER LOCAL USER
// ------------------------------------
async function registerLocalUser(email, password, name) {
    const existing = await prismaClient_1.default.user.findUnique({ where: { email } });
    if (existing) {
        throw new httpError_1.HttpError(409, "User already exists");
    }
    const hashed = await (0, bcryptjs_1.hash)(password, 10);
    const user = await prismaClient_1.default.user.create({
        data: {
            email,
            name,
            passwordHash: hashed
        },
        select: { id: true, email: true, name: true, role: true }
    });
    return user;
}
// ------------------------------------
// LOGIN LOCAL USER
// ------------------------------------
async function loginLocalUser(email, password) {
    const user = await prismaClient_1.default.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true
        }
    });
    if (!user || !user.passwordHash) {
        throw new httpError_1.HttpError(401, "Invalid credentials");
    }
    const valid = await (0, bcryptjs_1.compare)(password, user.passwordHash);
    if (!valid) {
        throw new httpError_1.HttpError(401, "Invalid credentials");
    }
    const { passwordHash, ...safe } = user;
    return safe;
}
