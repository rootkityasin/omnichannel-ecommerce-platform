const PLAN_ALIASES: Record<string, string> = {
  BASIC: "SILVER",
  STANDARD: "GOLD",
  PREMIUM: "GOLD",
  ENTERPRISE: "PLATINUM",
};

export const normalizePlan = (plan?: string | null) => {
  if (!plan) return "FREE";
  const normalized = plan.toString().trim().toUpperCase();
  return PLAN_ALIASES[normalized] || normalized;
};

export const toPlanSlug = (plan?: string | null) =>
  normalizePlan(plan).toLowerCase();

export const isAdvancedSeoPlan = (plan?: string | null) => {
  const normalized = normalizePlan(plan);
  return ["SILVER", "GOLD", "PLATINUM"].includes(normalized);
};
