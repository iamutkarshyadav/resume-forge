"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.createSession = createSession;
exports.registerLocalUser = registerLocalUser;
exports.loginLocalUser = loginLocalUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../utils/env");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const date_fns_1 = require("date-fns");
const bcryptjs_1 = require("bcryptjs");
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
    const expiresAt = (0, date_fns_1.add)(new Date(), { days: 30 });
    await prismaClient_1.default.refreshToken.create({
        data: {
            tokenHash,
            userId,
            expiresAt
        }
    });
}
// ------------------------------------
// REGISTER LOCAL USER
// ------------------------------------
async function registerLocalUser(email, password, name) {
    const existing = await prismaClient_1.default.user.findUnique({ where: { email } });
    if (existing) {
        throw new Error("User already exists");
    }
    const hashed = await (0, bcryptjs_1.hash)(password, 10);
    const user = await prismaClient_1.default.user.create({
        data: {
            email,
            name,
            passwordHash: hashed
        }
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
        throw new Error("Invalid credentials");
    }
    const valid = await (0, bcryptjs_1.compare)(password, user.passwordHash);
    if (!valid) {
        throw new Error("Invalid credentials");
    }
    return user;
}
