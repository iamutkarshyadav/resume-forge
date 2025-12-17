"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectedProcedure = exports.TRPCError = exports.middleware = exports.router = exports.publicProcedure = void 0;
const server_1 = require("@trpc/server");
Object.defineProperty(exports, "TRPCError", { enumerable: true, get: function () { return server_1.TRPCError; } });
const t = server_1.initTRPC.context().create();
exports.publicProcedure = t.procedure;
exports.router = t.router;
exports.middleware = t.middleware;
const isAuthed = (0, exports.middleware)(({ ctx, next }) => {
    if (!ctx.user) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});
exports.protectedProcedure = exports.publicProcedure.use(isAuthed);
