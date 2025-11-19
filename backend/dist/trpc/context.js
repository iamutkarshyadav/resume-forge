"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = createContext;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const env_1 = require("../utils/env");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function createContext({ req, res }) {
    try {
        const auth = req.headers.authorization;
        if (auth) {
            const token = auth.split(" ")[1];
            if (token) {
                const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_TOKEN_SECRET);
                const user = await prismaClient_1.default.user.findUnique({ where: { id: payload.sub } });
                if (user)
                    req.user = user;
            }
        }
    }
    catch (e) {
        // ignore invalid token
    }
    return { req, res, prisma: prismaClient_1.default };
}
