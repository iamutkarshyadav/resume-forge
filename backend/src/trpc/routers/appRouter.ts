import { router } from "../trpc";
import { authRouter } from "./auth.router";
import { userRouter } from "./user.router";
import { fileRouter } from "./file.router";
import { resumeRouter } from "./resume.router";
import { matchRouter } from "./match.router";
import { resumeVersionRouter } from "./resumeVersion.router";
import { jobDescriptionRouter } from "./jobDescription.router";
import { planRouter } from "./plan.router";
import { activityRouter } from "./activity.router";
import { onboardingRouter } from "./onboarding.router";
import { billingRouter } from "./billing.router";
import { pdfRouter } from "./pdf.router";

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  file: fileRouter,
  resume: resumeRouter,
  match: matchRouter,
  resumeVersion: resumeVersionRouter,
  jobDescription: jobDescriptionRouter,
  plan: planRouter,
  activity: activityRouter,
  onboarding: onboardingRouter,
  billing: billingRouter,
  pdf: pdfRouter,
});

export type AppRouter = typeof appRouter;
