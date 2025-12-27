import {Prisma, PrismaClient} from "@prisma/client"

declare global{
    var __prisma : PrismaClient | undefined;
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

const prisma =
globalForPrisma.prisma ??
new PrismaClient({
    log:process.env.NODE_ENV ==="development" ? ["query", "error", "warn"]: ["error"]
});

// Always set global singleton for all environments (including serverless)
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma;
}

export default prisma;
