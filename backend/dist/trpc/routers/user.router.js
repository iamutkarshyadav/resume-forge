"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
exports.userRouter = (0, trpc_1.router)({
    getProfile: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            return user;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error getting user profile:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to get user profile"
            });
        }
    }),
    updateProfile: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string().optional(),
        avatarUrl: zod_1.z.string().optional()
    }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const updated = await ctx.prisma.user.update({
                where: { id: user.id },
                data: { name: input.name }
            });
            return updated;
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error updating user profile:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to update user profile"
            });
        }
    })
});
