import { router } from "../trpc";
import { authRouter } from "./auth.router";
import { userRouter } from "./user.router";
import { fileRouter } from "./file.router";
import { resumeRouter } from "./resume.router";
import { matchRouter } from "./match.router";

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  file: fileRouter,
  resume: resumeRouter,
  match: matchRouter
});

export type AppRouter = typeof appRouter;
