import prisma from "../prismaClient";
import { HttpError } from "../utils/httpError";

export async function initializeOnboarding(userId: string) {
  const existing = await prisma.onboardingProgress.findUnique({
    where: { userId },
  });

  if (existing) return existing;

  return prisma.onboardingProgress.create({
    data: { userId },
  });
}

export async function getOnboardingProgress(userId: string) {
  const progress = await prisma.onboardingProgress.findUnique({
    where: { userId },
  });

  if (!progress) {
    throw new HttpError(404, "Onboarding progress not found");
  }

  return progress;
}

export async function markResumeUploaded(userId: string) {
  return prisma.onboardingProgress.update({
    where: { userId },
    data: { uploadedResume: true },
  });
}

export async function markFirstAnalysisCompleted(userId: string) {
  return prisma.onboardingProgress.update({
    where: { userId },
    data: { completedFirstAnalysis: true },
  });
}

export async function markJobDescriptionSaved(userId: string) {
  return prisma.onboardingProgress.update({
    where: { userId },
    data: { savedJobDescription: true },
  });
}

export async function markProgressViewed(userId: string) {
  return prisma.onboardingProgress.update({
    where: { userId },
    data: { viewedProgress: true },
  });
}

export async function skipOnboarding(userId: string) {
  return prisma.onboardingProgress.update({
    where: { userId },
    data: { skipped: true },
  });
}

export async function completeOnboarding(userId: string) {
  return prisma.onboardingProgress.update({
    where: { userId },
    data: { completedAt: new Date() },
  });
}

export async function getOnboardingStatus(userId: string) {
  const progress = await getOnboardingProgress(userId);

  const isComplete =
    progress.completedAt !== null || progress.skipped || progress.uploadedResume;

  const completedSteps = [
    progress.uploadedResume,
    progress.completedFirstAnalysis,
    progress.savedJobDescription,
    progress.viewedProgress,
  ].filter(Boolean).length;

  return {
    ...progress,
    isNew: !progress.uploadedResume && !progress.skipped,
    isOnboarding: !progress.completedAt && !progress.skipped,
    completedSteps,
    totalSteps: 4,
    completionPercentage: Math.round((completedSteps / 4) * 100),
  };
}
