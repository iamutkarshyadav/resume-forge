/**
 * Plan configuration with subscription limits
 * All plan-related limits and defaults are centralized here
 */

export const PLAN_LIMITS = {
  free: {
    analysesPerMonth: 10,
    savedJdsLimit: 5,
    aiGenerationsPerMonth: 3,
    exportModes: ["pdf"] as string[],
  },
  pro: {
    analysesPerMonth: 100,
    savedJdsLimit: 50,
    aiGenerationsPerMonth: 50,
    exportModes: ["pdf", "docx", "ats", "recruiter"] as string[],
  },
  enterprise: {
    analysesPerMonth: -1, // Unlimited
    savedJdsLimit: -1,    // Unlimited
    aiGenerationsPerMonth: -1, // Unlimited
    exportModes: ["pdf", "docx", "ats", "recruiter"] as string[],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType];
}

export const USAGE_WARNING_THRESHOLD = 0.8; // Warn when 80% of limits used
