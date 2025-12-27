"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContext = createContext;
const prismaClient_1 = __importDefault(require("../prismaClient"));
async function createContext({ req, res }) {
    const user = req.user;
    return { req: req, res, prisma: prismaClient_1.default, user };
}
