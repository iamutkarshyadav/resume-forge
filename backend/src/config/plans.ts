export const BILLING_PLANS = [
  {
    id: "basic",
    name: "Basic",
    description: "1 PDF Download",
    price: 999, // $9.99 in cents
    credits: 1,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "5 PDF Downloads",
    price: 2499, // $24.99 in cents
    credits: 5,
    popular: true,
  },
  {
    id: "executive",
    name: "Executive",
    description: "15 PDF Downloads",
    price: 4999, // $49.99 in cents
    credits: 15,
    popular: false,
  },
];

export const PLAN_LIMITS = {
  free: {
    analysesPerMonth: 3,
    savedJdsLimit: 1,
    aiGenerationsPerMonth: 3,
    exportModes: ["pdf"],
  },
  basic: {
    analysesPerMonth: BILLING_PLANS[0].credits, // 1
    savedJdsLimit: 5,
    aiGenerationsPerMonth: BILLING_PLANS[0].credits, // 1
    exportModes: ["pdf", "json"],
  },
  pro: {
    analysesPerMonth: BILLING_PLANS[1].credits, // 5
    savedJdsLimit: 20,
    aiGenerationsPerMonth: BILLING_PLANS[1].credits, // 5
    exportModes: ["pdf", "json", "docx"],
  },
  executive: {
    analysesPerMonth: BILLING_PLANS[2].credits, // 15
    savedJdsLimit: 50,
    aiGenerationsPerMonth: BILLING_PLANS[2].credits, // 15
    exportModes: ["pdf", "json", "docx", "txt"],
  },
};

export function getPlanLimits(planType: string) {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free; // Default to free if planType not found
}