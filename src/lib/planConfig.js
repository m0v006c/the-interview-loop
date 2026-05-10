/**
 * Plan configuration — single source of truth for all plan limits and features.
 * Feature gates throughout the app read from here.
 */

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: { monthly: 0, annual: 0 },
    limits: {
      interviews_per_month: 4,        // total across all tracks
      ai_problems_per_month: 0,       // tracked via ai_problems_used_total ≤ 1 lifetime
      ai_problems_lifetime: 1,        // 1 taste ever
      questions_per_track: 3,
    },
    features: {
      save_resume: false,
      history: false,
      skill_breakdown: false,
      reference_solution: false,
      key_moments: false,
      advanced_analytics: false,
      ai_problems: false,             // gated by lifetime limit
      priority_support: false,
    },
  },

  starter: {
    id: "starter",
    name: "Starter",
    price: { monthly: 12, annual: 10 },
    limits: {
      interviews_per_month: 20,
      ai_problems_per_month: 5,
      ai_problems_lifetime: Infinity,
      questions_per_track: Infinity,
    },
    features: {
      save_resume: true,
      history: true,
      skill_breakdown: true,          // basic skill breakdown
      reference_solution: true,
      key_moments: true,
      advanced_analytics: false,      // Pro only
      ai_problems: true,
      priority_support: false,
    },
  },

  pro: {
    id: "pro",
    name: "Pro",
    price: { monthly: 19, annual: 16 },
    limits: {
      interviews_per_month: Infinity,
      ai_problems_per_month: Infinity,
      ai_problems_lifetime: Infinity,
      questions_per_track: Infinity,
    },
    features: {
      save_resume: true,
      history: true,
      skill_breakdown: true,
      reference_solution: true,
      key_moments: true,
      advanced_analytics: true,       // trends, readiness, weak areas
      ai_problems: true,
      priority_support: true,
    },
  },
};

export const PLAN_ORDER = ["free", "starter", "pro"];

export function getPlan(planId) {
  return PLANS[planId] || PLANS.free;
}

export function hasFeature(planId, feature) {
  return getPlan(planId).features[feature] === true;
}

export function isAtLeast(planId, minPlan) {
  return PLAN_ORDER.indexOf(planId) >= PLAN_ORDER.indexOf(minPlan);
}

/** Check if user can start another interview this month */
export function canStartInterview(planId, usedThisMonth) {
  const limit = getPlan(planId).limits.interviews_per_month;
  if (limit === Infinity) return { allowed: true };
  if (usedThisMonth >= limit) {
    return {
      allowed: false,
      reason: `You've used all ${limit} interviews for this month.`,
      cta: planId === "free" ? "Upgrade to Starter for 20 interviews/month" : "Upgrade to Pro for unlimited interviews",
    };
  }
  return { allowed: true, remaining: limit - usedThisMonth };
}

/** Check if user can use an AI-curated problem */
export function canUseAIProblem(planId, usedThisMonth, usedTotal) {
  const plan = getPlan(planId);
  if (!plan.features.ai_problems && planId === "free") {
    // Free: 1 lifetime taste
    if (usedTotal >= plan.limits.ai_problems_lifetime) {
      return {
        allowed: false,
        reason: "You've used your free AI problem preview.",
        cta: "Upgrade to Starter for 5 AI problems/month",
      };
    }
    return { allowed: true, isTaste: true };
  }
  const monthlyLimit = plan.limits.ai_problems_per_month;
  if (monthlyLimit === Infinity) return { allowed: true };
  if (usedThisMonth >= monthlyLimit) {
    return {
      allowed: false,
      reason: `You've used all ${monthlyLimit} AI problems for this month.`,
      cta: "Upgrade to Pro for unlimited AI problems",
    };
  }
  return { allowed: true, remaining: monthlyLimit - usedThisMonth };
}

/** How many questions to show per track */
export function getVisibleQuestionsCount(planId) {
  const limit = getPlan(planId).limits.questions_per_track;
  return limit === Infinity ? null : limit; // null = show all
}

/** Get current month string for usage reset check */
export function currentUsageMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
