/**
 * usePlan — central hook for plan-gated features.
 *
 * Reads the user's plan from authStore and exposes clean helpers
 * so components don't need to know about planConfig internals.
 */

import { useAuthStore } from "@/lib/authStore";
import { useInterviewStore } from "@/lib/store";
import {
  getPlan,
  hasFeature,
  isAtLeast,
  canStartInterview,
  canUseAIProblem,
  getVisibleQuestionsCount,
  currentUsageMonth,
} from "@/lib/planConfig";

export function usePlan() {
  const profile   = useAuthStore((s) => s.profile);
  const user      = useAuthStore((s) => s.user);
  const enterLearnHub = useInterviewStore((s) => s.enterLearnHub);

  // Derive plan from profile (default free if not loaded)
  const planId = profile?.plan || "free";
  const plan   = getPlan(planId);

  // Reset usage if month changed
  const isCurrentMonth = profile?.usage_month === currentUsageMonth();
  const interviewsThisMonth = isCurrentMonth ? (profile?.interviews_this_month || 0) : 0;
  const aiProblemsThisMonth = isCurrentMonth ? (profile?.ai_problems_this_month || 0) : 0;
  const aiProblemsTotal     = profile?.ai_problems_used_total || 0;

  const interviewCheck   = canStartInterview(planId, interviewsThisMonth);
  const aiProblemCheck   = canUseAIProblem(planId, aiProblemsThisMonth, aiProblemsTotal);
  const visibleQuestions = getVisibleQuestionsCount(planId);

  const openPricing = () => {
    useInterviewStore.getState().setScreen?.("pricing");
  };

  return {
    planId,
    plan,
    planName: plan.name,
    isLoggedIn: !!user,

    // Feature checks
    can: (feature) => hasFeature(planId, feature),
    isAtLeast: (minPlan) => isAtLeast(planId, minPlan),

    // Interview limits
    canStartInterview: interviewCheck.allowed,
    interviewLimitReason: interviewCheck.reason,
    interviewLimitCta: interviewCheck.cta,
    interviewsThisMonth,
    interviewsLimit: plan.limits.interviews_per_month,
    interviewsRemaining: plan.limits.interviews_per_month === Infinity
      ? null
      : Math.max(0, plan.limits.interviews_per_month - interviewsThisMonth),

    // AI problem limits
    canUseAIProblem: aiProblemCheck.allowed,
    aiProblemReason: aiProblemCheck.reason,
    aiProblemCta:    aiProblemCheck.cta,
    aiProblemsThisMonth,
    aiProblemsRemaining: plan.limits.ai_problems_per_month === Infinity
      ? null
      : Math.max(0, plan.limits.ai_problems_per_month - aiProblemsThisMonth),

    // Question bank
    visibleQuestionsPerTrack: visibleQuestions, // null = all

    openPricing,
  };
}
