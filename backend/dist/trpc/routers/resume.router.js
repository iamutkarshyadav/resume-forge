"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
exports.resumeRouter = (0, trpc_1.router)({
    list: trpc_1.publicProcedure.query(async ({ ctx }) => {
        const current = ctx.req.user;
        if (!current) {
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        return ctx.prisma.resume.findMany({ where: { uploadedById: current.id } });
    }),
    get: trpc_1.publicProcedure.input(zod_1.z.object({ resumeId: zod_1.z.string() })).query(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current) {
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        const res = await ctx.prisma.resume.findFirst({ where: { id: input.resumeId, uploadedById: current.id } });
        if (!res)
            throw new trpc_1.TRPCError({ code: "NOT_FOUND" });
        return res;
    }),
    delete: trpc_1.publicProcedure.input(zod_1.z.object({ resumeId: zod_1.z.string() })).mutation(async ({ input, ctx }) => {
        const current = ctx.req.user;
        if (!current) {
            throw new trpc_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        const res = await ctx.prisma.resume.findFirst({ where: { id: input.resumeId, uploadedById: current.id } });
        if (!res)
            throw new trpc_1.TRPCError({ code: "NOT_FOUND" });
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
