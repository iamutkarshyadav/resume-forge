"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.userRouter = (0, trpc_1.router)({
    getProfile: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        return ctx.user;
    }),
    updateProfile: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string().optional(),
        avatarUrl: zod_1.z.string().optional()
    }))
        .mutation(async ({ input, ctx }) => {
        const updated = await ctx.prisma.user.update({
            where: { id: ctx.user.id },
            data: { name: input.name }
        });
        return updated;
    })
});
