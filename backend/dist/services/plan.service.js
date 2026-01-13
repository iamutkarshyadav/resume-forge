"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializePlan = initializePlan;
exports.getPlan = getPlan;
exports.incrementUsage = incrementUsage;
exports.getUsage = getUsage;
exports.checkLimit = checkLimit;
exports.upgradePlan = upgradePlan;
exports.getUserMetrics = getUserMetrics;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const httpError_1 = require("../utils/httpError");
const plans_1 = require("../config/plans");
const CURRENT_MONTH = getCurrentMonth();
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
async function initializePlan(userId) {
    const freeLimits = (0, plans_1.getPlanLimits)("free");
    // Use upsert to safely handle race conditions - creates if missing, updates if exists
    const plan = await prismaClient_1.default.userPlan.upsert({
        where: { userId },
        create: {
            userId,
            planType: "free",
            analysesPerMonth: freeLimits.analysesPerMonth,
            savedJdsLimit: freeLimits.savedJdsLimit,
            aiGenerationsPerMonth: freeLimits.aiGenerationsPerMonth,
            exportModes: freeLimits.exportModes,
            currentMonth: CURRENT_MONTH
        },
        update: {
            // Only update currentMonth if it's different (month rollover)
            currentMonth: CURRENT_MONTH
        }
    });
    // Log if we're updating an existing plan (production warning)
    if (process.env.NODE_ENV === "production") {
        const existingPlan = await prismaClient_1.default.userPlan.findUnique({ where: { userId } });
        if (existingPlan && existingPlan.currentMonth !== CURRENT_MONTH) {
            console.warn(`[PlanService] Month rollover detected for user ${userId}: ${existingPlan.currentMonth} -> ${CURRENT_MONTH}`);
        }
    }
    return plan;
}
async function getPlan(userId) {
    let plan = await prismaClient_1.default.userPlan.findUnique({ where: { userId } });
    if (!plan) {
        plan = await initializePlan(userId);
    }
    return plan;
}
async function incrementUsage(userId, metric) {
    const month = getCurrentMonth();
    // First, try to find existing usage
    let usage = await prismaClient_1.default.usageMetrics.findFirst({
        where: { userId, month }
    });
    if (usage) {
        // Update existing usage
        const updateData = {};
        if (metric === "analyses")
            updateData.analysesUsed = { increment: 1 };
        if (metric === "aiGenerations")
            updateData.aiGenerationsUsed = { increment: 1 };
        if (metric === "jdsSaved")
            updateData.jdsSaved = { increment: 1 };
        usage = await prismaClient_1.default.usageMetrics.update({
            where: { id: usage.id },
            data: updateData
        });
    }
    else {
        // Create new usage with race condition protection
        try {
            usage = await prismaClient_1.default.usageMetrics.create({
                data: {
                    userId,
                    month,
                    analysesUsed: metric === "analyses" ? 1 : 0,
                    aiGenerationsUsed: metric === "aiGenerations" ? 1 : 0,
                    jdsSaved: metric === "jdsSaved" ? 1 : 0
                }
            });
        }
        catch (error) {
            // Handle race condition: if another request created it, fetch and update
            if (error.code === "P2002" || error.code === 11000) {
                usage = await prismaClient_1.default.usageMetrics.findFirst({
                    where: { userId, month }
                });
                if (!usage)
                    throw new httpError_1.HttpError(500, "Failed to create or find usage metrics");
                const updateData = {};
                if (metric === "analyses")
                    updateData.analysesUsed = { increment: 1 };
                if (metric === "aiGenerations")
                    updateData.aiGenerationsUsed = { increment: 1 };
                if (metric === "jdsSaved")
                    updateData.jdsSaved = { increment: 1 };
                usage = await prismaClient_1.default.usageMetrics.update({
                    where: { id: usage.id },
                    data: updateData
                });
            }
            else {
                throw error;
            }
        }
    }
    return usage;
}
async function getUsage(userId) {
    const month = getCurrentMonth();
    // Try to find existing usage
    let usage = await prismaClient_1.default.usageMetrics.findFirst({
        where: { userId, month }
    });
    if (!usage) {
        // Create new usage with race condition protection
        try {
            usage = await prismaClient_1.default.usageMetrics.create({
                data: {
                    userId,
                    month,
                    analysesUsed: 0,
                    aiGenerationsUsed: 0,
                    jdsSaved: 0
                }
            });
        }
        catch (error) {
            // Handle race condition: if another request created it, just fetch it
            if (error.code === "P2002" || error.code === 11000) {
                usage = await prismaClient_1.default.usageMetrics.findFirst({
                    where: { userId, month }
                });
                if (!usage)
                    throw new httpError_1.HttpError(500, "Failed to create or find usage metrics");
            }
            else {
                throw error;
            }
        }
    }
    return usage;
}
async function checkLimit(userId, limitType) {
    const plan = await getPlan(userId);
    const usage = await getUsage(userId);
    if (limitType === "analyses") {
        if (plan.analysesPerMonth === -1)
            return { allowed: true, remaining: -1, limit: -1 };
        const remaining = Math.max(0, plan.analysesPerMonth - usage.analysesUsed);
        return { allowed: remaining > 0, remaining, limit: plan.analysesPerMonth };
    }
    if (limitType === "aiGenerations") {
        if (plan.aiGenerationsPerMonth === -1)
            return { allowed: true, remaining: -1, limit: -1 };
        const remaining = Math.max(0, plan.aiGenerationsPerMonth - usage.aiGenerationsUsed);
        return { allowed: remaining > 0, remaining, limit: plan.aiGenerationsPerMonth };
    }
    if (limitType === "jdsSaved") {
        if (plan.savedJdsLimit === -1)
            return { allowed: true, remaining: -1, limit: -1 };
        const jdCount = await prismaClient_1.default.jobDescription.count({ where: { userId } });
        const remaining = Math.max(0, plan.savedJdsLimit - jdCount);
        return { allowed: remaining > 0, remaining, limit: plan.savedJdsLimit };
    }
    return { allowed: false, remaining: 0, limit: 0 };
}
async function upgradePlan(userId, planType) {
    const limits = (0, plans_1.getPlanLimits)(planType);
    const plan = await prismaClient_1.default.userPlan.update({
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
async function getUserMetrics(userId) {
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
            used: await prismaClient_1.default.jobDescription.count({ where: { userId } }),
            limit: plan.savedJdsLimit
        },
        planType: plan.planType,
        exportModes: plan.exportModes
    };
}
