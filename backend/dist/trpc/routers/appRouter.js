"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("../trpc");
const auth_router_1 = require("./auth.router");
const user_router_1 = require("./user.router");
const file_router_1 = require("./file.router");
const resume_router_1 = require("./resume.router");
exports.appRouter = (0, trpc_1.router)({
    auth: auth_router_1.authRouter,
    user: user_router_1.userRouter,
    file: file_router_1.fileRouter,
    resume: resume_router_1.resumeRouter
});
