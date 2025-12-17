"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.fileRouter = (0, trpc_1.router)({
    listFiles: trpc_1.publicProcedure.input(zod_1.z.object({ userId: zod_1.z.string() })).query(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current || current.id !== input.userId) {
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        return ctx.prisma.resume.findMany({ where: { uploadedById: input.userId }, orderBy: { createdAt: "desc" } });
    }),
    deleteFile: trpc_1.publicProcedure.input(zod_1.z.object({ fileId: zod_1.z.string() })).mutation(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current) {
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        const resume = await ctx.prisma.resume.findFirst({ where: { id: input.fileId, uploadedById: current.id } });
        if (!resume)
            throw new trpc_1.TRPCError({ code: "NOT_FOUND" });
        const path = resume.jsonData?.path;
        if (path) {
            try {
                require("fs").unlinkSync(path);
            }
            catch { }
        }
        await ctx.prisma.resume.delete({ where: { id: resume.id } });
        return { success: true };
    })
});
