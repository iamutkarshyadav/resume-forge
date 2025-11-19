"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.userRouter = (0, trpc_1.router)({
    getProfile: trpc_1.publicProcedure.input(zod_1.z.object({ userId: zod_1.z.string() })).query(async ({ input, ctx }) => {
        const user = await ctx.prisma.user.findUnique({ where: { id: input.userId } });
        return user;
    }),
    updateProfile: trpc_1.publicProcedure.input(zod_1.z.object({
        userId: zod_1.z.string(),
        name: zod_1.z.string().optional(),
        avatarUrl: zod_1.z.string().optional()
    })).mutation(async ({ input, ctx }) => {
        const updated = await ctx.prisma.user.update({
            where: { id: input.userId },
            data: { name: input.name }
        });
        return updated;
    })
});
