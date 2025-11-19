"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.resumeRouter = (0, trpc_1.router)({
    list: trpc_1.publicProcedure.input(zod_1.z.object({ userId: zod_1.z.string() })).query(async ({ input, ctx }) => {
        return ctx.prisma.resume.findMany({ where: { uploadedById: input.userId } });
    }),
    get: trpc_1.publicProcedure.input(zod_1.z.object({ userId: zod_1.z.string(), resumeId: zod_1.z.string() })).query(async ({ input, ctx }) => {
        const res = await ctx.prisma.resume.findFirst({ where: { id: input.resumeId, uploadedById: input.userId } });
        if (!res)
            throw new Error("Not found");
        return res;
    }),
    delete: trpc_1.publicProcedure.input(zod_1.z.object({ userId: zod_1.z.string(), resumeId: zod_1.z.string() })).mutation(async ({ input, ctx }) => {
        const res = await ctx.prisma.resume.findFirst({ where: { id: input.resumeId, uploadedById: input.userId } });
        if (!res)
            throw new Error("Not found");
        const path = res.jsonData?.path;
        if (path) {
            try {
                require("fs").unlinkSync(path);
            }
            catch { }
        }
        await ctx.prisma.resume.delete({ where: { id: input.resumeId } });
        return { success: true };
    })
});
