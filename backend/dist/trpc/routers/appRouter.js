"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("../trpc");
const auth_router_1 = require("./auth.router");
const user_router_1 = require("./user.router");
const file_router_1 = require("./file.router");
const resume_router_1 = require("./resume.router");
const match_router_1 = require("./match.router");
const resumeVersion_router_1 = require("./resumeVersion.router");
const jobDescription_router_1 = require("./jobDescription.router");
const plan_router_1 = require("./plan.router");
exports.appRouter = (0, trpc_1.router)({
    auth: auth_router_1.authRouter,
    user: user_router_1.userRouter,
    file: file_router_1.fileRouter,
    resume: resume_router_1.resumeRouter,
    match: match_router_1.matchRouter,
    resumeVersion: resumeVersion_router_1.resumeVersionRouter,
    jobDescription: jobDescription_router_1.jobDescriptionRouter,
    plan: plan_router_1.planRouter
});
