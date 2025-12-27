"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const globalForPrisma = global;
const prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    });
// Always set global singleton for all environments (including serverless)
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
}
exports.default = prisma;
