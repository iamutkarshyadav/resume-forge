"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const validate_context_1 = require("../validate-context");
const fs_1 = __importDefault(require("fs"));
exports.fileRouter = (0, trpc_1.router)({
    deleteFile: trpc_1.protectedProcedure
        .input(zod_1.z.object({ fileId: zod_1.z.string() }))
        .mutation(async ({ input, ctx }) => {
        try {
            const user = (0, validate_context_1.validateAuthContext)(ctx);
            const resume = await ctx.prisma.resume.findUnique({
                where: { id: input.fileId }
            });
            if (!resume)
                throw new trpc_1.TRPCError({ code: "NOT_FOUND" });
            // Ownership check
            if (resume.uploadedById !== user.id && String(user.role || "").toUpperCase() !== "ADMIN") {
                throw new trpc_1.TRPCError({ code: "FORBIDDEN" });
            }
            // Delete file from filesystem with error logging
            const path = resume.jsonData?.path;
            if (path) {
                try {
                    fs_1.default.unlinkSync(path);
                }
                catch (err) {
                    console.warn(`Failed to delete file at ${path}:`, err?.message || String(err));
                    // Continue - database deletion should still succeed
                }
            }
            await ctx.prisma.resume.delete({ where: { id: resume.id } });
            return { success: true };
        }
        catch (err) {
            if (err instanceof trpc_1.TRPCError)
                throw err;
            console.error("Error deleting file:", err);
            throw new trpc_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to delete file"
            });
        }
    })
});
