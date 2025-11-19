"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const auth_service_1 = require("../../services/auth.service");
exports.authRouter = (0, trpc_1.router)({
    // Refresh token endpoint (client sends refresh token in body)
    refresh: trpc_1.publicProcedure.input(zod_1.z.object({ refreshToken: zod_1.z.string() })).mutation(async ({ input }) => {
        // Validate refresh token, issue new access token
        const jwt = require("jsonwebtoken");
        const { env } = require("../../utils/env");
        try {
            const payload = jwt.verify(input.refreshToken, env.JWT_REFRESH_TOKEN_SECRET);
            const userId = payload.sub;
            const accessToken = (0, auth_service_1.signAccessToken)(userId);
            const newRefresh = (0, auth_service_1.signRefreshToken)(userId);
            await (0, auth_service_1.createSession)(userId, newRefresh);
            return { accessToken, refreshToken: newRefresh };
        }
        catch (err) {
            throw new Error("Invalid refresh token");
        }
    }),
    // get current user (example)
    me: trpc_1.publicProcedure.query(async ({ ctx }) => {
        const user = ctx.req.user ?? null;
        return user ?? null;
    })
});
