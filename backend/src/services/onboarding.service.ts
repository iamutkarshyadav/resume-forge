import prisma from "../prismaClient";
import { HttpError } from "../utils/httpError";

// Validate Prisma client is available at module load time
if (!prisma) {
  const err = new Error("CRITICAL: Prisma client not initialized in onboarding service");
  console.error("❌", err.message);
  process.exit(1);
}

// Helper to validate Prisma is ready before each operation
function ensurePrismaReady(userId?: string) {
  if (!prisma) {
    const msg = "Database client not initialized";
    console.error("❌", msg, userId ? `for user ${userId}` : "");
    throw new HttpError(500, msg);
  }
}

export async function initializeOnboarding(userId: string) {
  try {
    if (!userId) {
      throw new HttpError(400, "userId is required");
    }

    if (!prisma) {
      throw new HttpError(500, "Database client not available");
    }

    // Check if onboarding progress already exists (idempotent)
    const existing = await prisma.onboardingProgress.findUnique({
      where: { userId },
    });

    if (existing) {
      console.log(`Onboarding already initialized for user ${userId}`);
      return existing;
    }

    // Create new onboarding progress entry
    const newProgress = await prisma.onboardingProgress.create({
      data: { userId },
    });

    console.log(`Onboarding initialized for user ${userId}`);
    return newProgress;
  } catch (error: any) {
    console.error(`Error initializing onboarding for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to initialize onboarding");
  }
}

export async function getOnboardingProgress(userId: string) {
  try {
    if (!userId || typeof userId !== "string") {
      const msg = "userId is required and must be a valid string";
      console.error(`[getOnboardingProgress] Validation error: ${msg}, received: ${typeof userId} = ${String(userId)}`);
      throw new HttpError(400, msg);
    }

    ensurePrismaReady(userId);

    // Use upsert to auto-heal missing records atomically (prevents race conditions)
    let progress;
    try {
      console.log(`[getOnboardingProgress] Attempting upsert for userId: ${userId}`);

      progress = await prisma.onboardingProgress.upsert({
        where: { userId },
        update: {}, // Don't update anything if it exists
        create: { userId }, // Create if missing
      });

      console.log(`[getOnboardingProgress] Upsert succeeded for userId: ${userId}`);
    } catch (dbError: any) {
      // Log detailed Prisma error for debugging
      const errorDetails = {
        message: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta,
        prismaCode: dbError?.prismaCode,
        stack: dbError?.stack?.split('\n').slice(0, 3).join('\n'),
      };

      console.error(
        `[getOnboardingProgress] Prisma upsert FAILED [userId: ${userId}]:`,
        JSON.stringify(errorDetails, null, 2)
      );

      // Rethrow the original error for better debugging
      throw dbError;
    }

    if (!progress) {
      const msg = "Upsert returned null - failed to retrieve onboarding progress record";
      console.error(`[getOnboardingProgress] ${msg} [userId: ${userId}]`);
      throw new HttpError(500, msg);
    }

    console.log(`[getOnboardingProgress] Successfully retrieved progress for userId: ${userId}`);
    return progress;
  } catch (error: any) {
    // If it's already an HttpError, rethrow it
    if (error instanceof HttpError) {
      console.error(`[getOnboardingProgress] HttpError for userId ${userId}:`, error.message);
      throw error;
    }

    // Log the raw error for debugging
    const errorMsg = error?.message || String(error);
    console.error(`[getOnboardingProgress] Unexpected error for userId ${userId}:`, {
      message: errorMsg,
      code: error?.code,
      prismaCode: error?.prismaCode,
    });

    // Throw with original error details
    throw new HttpError(500, `Database error: ${errorMsg}`);
  }
}

export async function markResumeUploaded(userId: string) {
  try {
    if (!userId) throw new HttpError(400, "userId is required");
    if (!prisma) throw new HttpError(500, "Database client not available");

    return await prisma.onboardingProgress.upsert({
      where: { userId },
      update: { uploadedResume: true },
      create: { userId, uploadedResume: true },
    });
  } catch (error: any) {
    console.error(`Error marking resume uploaded for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to update onboarding progress");
  }
}

export async function markFirstAnalysisCompleted(userId: string) {
  try {
    if (!userId) throw new HttpError(400, "userId is required");
    if (!prisma) throw new HttpError(500, "Database client not available");

    return await prisma.onboardingProgress.upsert({
      where: { userId },
      update: { completedFirstAnalysis: true },
      create: { userId, completedFirstAnalysis: true },
    });
  } catch (error: any) {
    console.error(`Error marking first analysis completed for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to update onboarding progress");
  }
}

export async function markJobDescriptionSaved(userId: string) {
  try {
    if (!userId) throw new HttpError(400, "userId is required");
    if (!prisma) throw new HttpError(500, "Database client not available");

    return await prisma.onboardingProgress.upsert({
      where: { userId },
      update: { savedJobDescription: true },
      create: { userId, savedJobDescription: true },
    });
  } catch (error: any) {
    console.error(`Error marking job description saved for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to update onboarding progress");
  }
}

export async function markProgressViewed(userId: string) {
  try {
    if (!userId) throw new HttpError(400, "userId is required");
    if (!prisma) throw new HttpError(500, "Database client not available");

    return await prisma.onboardingProgress.upsert({
      where: { userId },
      update: { viewedProgress: true },
      create: { userId, viewedProgress: true },
    });
  } catch (error: any) {
    console.error(`Error marking progress viewed for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to update onboarding progress");
  }
}

export async function skipOnboarding(userId: string) {
  try {
    if (!userId) throw new HttpError(400, "userId is required");
    if (!prisma) throw new HttpError(500, "Database client not available");

    return await prisma.onboardingProgress.upsert({
      where: { userId },
      update: { skipped: true },
      create: { userId, skipped: true },
    });
  } catch (error: any) {
    console.error(`Error skipping onboarding for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to update onboarding progress");
  }
}

export async function completeOnboarding(userId: string) {
  try {
    if (!userId) throw new HttpError(400, "userId is required");
    if (!prisma) throw new HttpError(500, "Database client not available");

    return await prisma.onboardingProgress.upsert({
      where: { userId },
      update: { completedAt: new Date() },
      create: { userId, completedAt: new Date() },
    });
  } catch (error: any) {
    console.error(`Error completing onboarding for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to update onboarding progress");
  }
}

export async function getOnboardingStatus(userId: string) {
  try {
    if (!userId) {
      throw new HttpError(400, "userId is required");
    }

    if (!prisma) {
      throw new HttpError(500, "Database client not available");
    }

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
  } catch (error: any) {
    console.error(`Error getting onboarding status for user ${userId}:`, error);
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "Failed to get onboarding status");
  }
}
