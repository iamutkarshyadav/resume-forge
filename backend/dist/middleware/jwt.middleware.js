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
            return res.status(401).json({ message: "missing authorization header" });
        const token = authHeader.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "invalid authorization header format" });
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_TOKEN_SECRET);
        const user = await prismaClient_1.default.user.findUnique({ where: { id: payload.sub } });
        if (!user)
            return res.status(401).json({ message: "user not found" });
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ message: "unauthorized", details: err.message });
    }
}
