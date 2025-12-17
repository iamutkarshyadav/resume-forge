/**
 * Feature flags and plan-driven UI behavior
 * Controls which features are available based on user plan
 */

export type PlanType = "free" | "pro" | "enterprise";

export interface FeatureFlags {
  canAnalyze: boolean;
  canGenerate: boolean;
  canExportPdf: boolean;
  canExportDocx: boolean;
  canExportAts: boolean;
  canExportRecruiter: boolean;
  analyticsEnabled: boolean;
  prioritySupport: boolean;
  unlimitedAnalyses: boolean;
  unlimitedGenerations: boolean;
}

export function getFeatureFlags(planType: PlanType): FeatureFlags {
  const baseFlags: FeatureFlags = {
    canAnalyze: true,
    canGenerate: false,
    canExportPdf: true,
    canExportDocx: false,
    canExportAts: false,
    canExportRecruiter: false,
    analyticsEnabled: false,
    prioritySupport: false,
    unlimitedAnalyses: false,
    unlimitedGenerations: false,
  };

  if (planType === "pro") {
    return {
      ...baseFlags,
      canGenerate: true,
      canExportDocx: true,
      canExportAts: true,
      canExportRecruiter: true,
      analyticsEnabled: true,
      prioritySupport: true,
    };
  }

  if (planType === "enterprise") {
    return {
      ...baseFlags,
      canGenerate: true,
      canExportDocx: true,
      canExportAts: true,
      canExportRecruiter: true,
      analyticsEnabled: true,
      prioritySupport: true,
      unlimitedAnalyses: true,
      unlimitedGenerations: true,
    };
  }

  return baseFlags;
}

export function canFeature(feature: keyof FeatureFlags, planType: PlanType): boolean {
  const flags = getFeatureFlags(planType);
  return flags[feature];
}

export function getFeatureRequiredPlan(feature: keyof FeatureFlags): PlanType {
  // Returns the minimum plan required for a feature
  const feature_plan_map: Record<string, PlanType> = {
    canGenerate: "pro",
    canExportDocx: "pro",
    canExportAts: "pro",
    canExportRecruiter: "pro",
    analyticsEnabled: "pro",
    prioritySupport: "pro",
    unlimitedAnalyses: "enterprise",
    unlimitedGenerations: "enterprise",
  };

  return feature_plan_map[feature] || "free";
}
