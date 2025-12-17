"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const trpc_1 = require("../trpc");
const zod_1 = require("zod");
const auth_service_1 = require("../../services/auth.service");
const signupSchema = zod_1.z.object({
    firstname: zod_1.z.string().min(1),
    lastname: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8)
});
exports.authRouter = (0, trpc_1.router)({
    signup: trpc_1.publicProcedure.input(signupSchema).mutation(async ({ input }) => {
        const { firstname, lastname, email, password } = input;
        const name = `${firstname} ${lastname}`;
        const user = await (0, auth_service_1.registerLocalUser)(email, password, name);
        const accessToken = (0, auth_service_1.signAccessToken)(user.id);
        const refreshToken = (0, auth_service_1.signRefreshToken)(user.id);
        await (0, auth_service_1.createSession)(user.id, refreshToken);
        return { user, accessToken, refreshToken };
    }),
    login: trpc_1.publicProcedure
        .input(zod_1.z.object({ email: zod_1.z.string().email(), password: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        const user = await (0, auth_service_1.loginLocalUser)(input.email, input.password);
        const accessToken = (0, auth_service_1.signAccessToken)(user.id);
        const refreshToken = (0, auth_service_1.signRefreshToken)(user.id);
        await (0, auth_service_1.createSession)(user.id, refreshToken);
        return { user, accessToken, refreshToken };
    }),
    refresh: trpc_1.publicProcedure
        .input(zod_1.z.object({ refreshToken: zod_1.z.string() }))
        .mutation(async ({ input }) => {
        const result = await (0, auth_service_1.verifyAndRotateRefreshToken)(input.refreshToken);
        return { accessToken: result.accessToken, refreshToken: result.refreshToken };
    }),
    me: trpc_1.publicProcedure.query(async ({ ctx }) => {
        const user = ctx.req.user ?? null;
        return user ?? null;
    })
});
