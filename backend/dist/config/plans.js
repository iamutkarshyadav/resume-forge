"use strict";
/**
 * Plan configuration with subscription limits
 * All plan-related limits and defaults are centralized here
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.USAGE_WARNING_THRESHOLD = exports.PLAN_LIMITS = void 0;
exports.getPlanLimits = getPlanLimits;
exports.PLAN_LIMITS = {
    free: {
        analysesPerMonth: 10,
        savedJdsLimit: 5,
        aiGenerationsPerMonth: 3,
        exportModes: ["pdf"],
    },
    pro: {
        analysesPerMonth: 100,
        savedJdsLimit: 50,
        aiGenerationsPerMonth: 50,
        exportModes: ["pdf", "docx", "ats", "recruiter"],
    },
    enterprise: {
        analysesPerMonth: -1, // Unlimited
        savedJdsLimit: -1, // Unlimited
        aiGenerationsPerMonth: -1, // Unlimited
        exportModes: ["pdf", "docx", "ats", "recruiter"],
    },
};
function getPlanLimits(planType) {
    return exports.PLAN_LIMITS[planType];
}
exports.USAGE_WARNING_THRESHOLD = 0.8; // Warn when 80% of limits used
