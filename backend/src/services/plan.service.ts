import prisma from "../prismaClient";
import { HttpError } from "../utils/httpError";
import { getPlanLimits, PLAN_LIMITS } from "../config/plans";

const CURRENT_MONTH = getCurrentMonth();

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function initializePlan(userId: string) {
  // Check if plan already exists
  let plan = await prisma.userPlan.findUnique({ where: { userId } });

  if (!plan) {
    const freeLimits = getPlanLimits("free");
    plan = await prisma.userPlan.create({
      data: {
        userId,
        planType: "free",
        analysesPerMonth: freeLimits.analysesPerMonth,
        savedJdsLimit: freeLimits.savedJdsLimit,
        aiGenerationsPerMonth: freeLimits.aiGenerationsPerMonth,
        exportModes: freeLimits.exportModes,
        currentMonth: CURRENT_MONTH
      }
    });
  }

  return plan;
}

export async function getPlan(userId: string) {
  let plan = await prisma.userPlan.findUnique({ where: { userId } });
  
  if (!plan) {
    plan = await initializePlan(userId);
  }

  return plan;
}

export async function incrementUsage(userId: string, metric: "analyses" | "aiGenerations" | "jdsSaved") {
  const month = getCurrentMonth();

  let usage = await prisma.usageMetrics.findFirst({
    where: { userId, month }
  });

  if (!usage) {
    usage = await prisma.usageMetrics.create({
      data: {
        userId,
        month,
        analysesUsed: metric === "analyses" ? 1 : 0,
        aiGenerationsUsed: metric === "aiGenerations" ? 1 : 0,
        jdsSaved: metric === "jdsSaved" ? 1 : 0
      }
    });
  } else {
    const updateData: any = {};
    if (metric === "analyses") updateData.analysesUsed = { increment: 1 };
    if (metric === "aiGenerations") updateData.aiGenerationsUsed = { increment: 1 };
    if (metric === "jdsSaved") updateData.jdsSaved = { increment: 1 };

    usage = await prisma.usageMetrics.update({
      where: { id: usage.id },
      data: updateData
    });
  }

  return usage;
}

export async function getUsage(userId: string) {
  const month = getCurrentMonth();

  let usage = await prisma.usageMetrics.findFirst({
    where: { userId, month }
  });

  if (!usage) {
    usage = await prisma.usageMetrics.create({
      data: {
        userId,
        month,
        analysesUsed: 0,
        aiGenerationsUsed: 0,
        jdsSaved: 0
      }
    });
  }

  return usage;
}

export async function checkLimit(userId: string, limitType: "analyses" | "aiGenerations" | "jdsSaved"): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const plan = await getPlan(userId);
  const usage = await getUsage(userId);

  if (limitType === "analyses") {
    if (plan.analysesPerMonth === -1) return { allowed: true, remaining: -1, limit: -1 };
    const remaining = Math.max(0, plan.analysesPerMonth - usage.analysesUsed);
    return { allowed: remaining > 0, remaining, limit: plan.analysesPerMonth };
  }

  if (limitType === "aiGenerations") {
    if (plan.aiGenerationsPerMonth === -1) return { allowed: true, remaining: -1, limit: -1 };
    const remaining = Math.max(0, plan.aiGenerationsPerMonth - usage.aiGenerationsUsed);
    return { allowed: remaining > 0, remaining, limit: plan.aiGenerationsPerMonth };
  }

  if (limitType === "jdsSaved") {
    if (plan.savedJdsLimit === -1) return { allowed: true, remaining: -1, limit: -1 };
    const jdCount = await prisma.jobDescription.count({ where: { userId } });
    const remaining = Math.max(0, plan.savedJdsLimit - jdCount);
    return { allowed: remaining > 0, remaining, limit: plan.savedJdsLimit };
  }

  return { allowed: false, remaining: 0, limit: 0 };
}

export async function upgradePlan(userId: string, planType: "pro" | "enterprise") {
  const limits = getPlanLimits(planType);

  const plan = await prisma.userPlan.update({
    where: { userId },
    data: {
      planType,
      analysesPerMonth: limits.analysesPerMonth,
      savedJdsLimit: limits.savedJdsLimit,
      aiGenerationsPerMonth: limits.aiGenerationsPerMonth,
      exportModes: limits.exportModes
    }
  });

  return plan;
}

export async function getUserMetrics(userId: string) {
  const usage = await getUsage(userId);
  const plan = await getPlan(userId);
  
  const analysisUsage = plan.analysesPerMonth === -1 ? null : (usage.analysesUsed / plan.analysesPerMonth) * 100;
  const aiUsage = plan.aiGenerationsPerMonth === -1 ? null : (usage.aiGenerationsUsed / plan.aiGenerationsPerMonth) * 100;

  return {
    currentMonth: usage.month,
    analysisUsage: {
      used: usage.analysesUsed,
      limit: plan.analysesPerMonth,
      percentage: analysisUsage
    },
    aiGenerationUsage: {
      used: usage.aiGenerationsUsed,
      limit: plan.aiGenerationsPerMonth,
      percentage: aiUsage
    },
    jdsSaved: {
      used: await prisma.jobDescription.count({ where: { userId } }),
      limit: plan.savedJdsLimit
    },
    planType: plan.planType,
    exportModes: plan.exportModes
  };
}
