import { useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { PLANS } from "@/lib/planConfig";

const FEATURES = [
  { key: "interviews", label: "Interviews / month" },
  { key: "questions", label: "Questions per track" },
  { key: "ai_problems", label: "AI-curated problems" },
  { key: "save_resume", label: "Save & resume sessions" },
  { key: "history", label: "History & progress" },
  { key: "reference_solution", label: "Reference solutions" },
  { key: "key_moments", label: "Key moments feedback" },
  { key: "advanced_analytics", label: "Advanced analytics & trends" },
  { key: "priority_support", label: "Priority support" },
];

function planValue(planId, key) {
  const p = PLANS[planId];
  switch (key) {
    case "interviews":
      return p.limits.interviews_per_month === Infinity ? "Unlimited" : `${p.limits.interviews_per_month}/month`;
    case "questions":
      return p.limits.questions_per_track === Infinity ? "All 50+" : `${p.limits.questions_per_track} per track`;
    case "ai_problems":
      if (planId === "free") return "1 lifetime taste";
      return p.limits.ai_problems_per_month === Infinity ? "Unlimited" : `${p.limits.ai_problems_per_month}/month`;
    default: return p.features[key] ? "✓" : "—";
  }
}

const VERDICT_COLORS = { free: "gray", starter: "indigo", pro: "purple" };
const PLAN_LABELS = { free: "Free", starter: "Starter", pro: "Pro" };
const PLAN_DESCRIPTIONS = {
  free: "Explore the platform. One interview per track.",
  starter: "Regular practice with full feedback and AI variety.",
  pro: "Unlimited interviews for serious job seekers.",
};

export default function PricingScreen() {
  const [annual, setAnnual] = useState(false);
  const goLanding = useInterviewStore((s) => s.goLanding);
  const profile = useAuthStore((s) => s.profile);
  const currentPlan = profile?.plan || "free";

  const price = (planId) => {
    const p = PLANS[planId];
    const amount = annual ? p.price.annual : p.price.monthly;
    return amount;
  };

  const STRIPE_LINKS = {
    starter_monthly: import.meta.env.VITE_STRIPE_STARTER_MONTHLY || null,
    starter_annual:  import.meta.env.VITE_STRIPE_STARTER_ANNUAL  || null,
    pro_monthly:     import.meta.env.VITE_STRIPE_PRO_MONTHLY     || null,
    pro_annual:      import.meta.env.VITE_STRIPE_PRO_ANNUAL      || null,
  };

  const handleUpgrade = (planId) => {
    const key = `${planId}_${annual ? "annual" : "monthly"}`;
    if (STRIPE_LINKS[key]) {
      window.open(STRIPE_LINKS[key], "_blank");
    } else {
      alert("Payment coming soon! Get notified at theinterviewloop@gmail.com");
    }
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <button onClick={goLanding} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-6 inline-block">
          ← Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Simple, transparent pricing</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Start free. Upgrade when you're serious about interviews.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="inline-flex items-center gap-3 mt-5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!annual ? "bg-white dark:bg-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${annual ? "bg-white dark:bg-gray-900 shadow-sm" : "text-gray-500"}`}
          >
            Annual <span className="text-emerald-600 text-[11px] font-semibold ml-1">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {["free", "starter", "pro"].map((planId) => {
          const isCurrentPlan = planId === currentPlan;
          const isPro = planId === "pro";
          return (
            <div
              key={planId}
              className={`rounded-2xl border p-6 flex flex-col ${
                isPro
                  ? "border-purple-300 dark:border-purple-500/40 bg-gradient-to-b from-purple-50 to-white dark:from-purple-500/10 dark:to-gray-900"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              } ${isCurrentPlan ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-950" : ""}`}
            >
              {isPro && (
                <div className="text-[11px] uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-400 mb-2">
                  Most popular
                </div>
              )}
              <div className="text-lg font-bold mb-1">{PLAN_LABELS[planId]}</div>
              <div className="text-[13px] text-gray-500 mb-4 leading-relaxed">{PLAN_DESCRIPTIONS[planId]}</div>

              <div className="mb-5">
                <span className="text-4xl font-bold">${price(planId)}</span>
                {price(planId) > 0 && (
                  <span className="text-gray-500 text-sm ml-1">/month{annual ? " (billed annually)" : ""}</span>
                )}
              </div>

              {/* mt-auto pushes button to bottom so all cards align */}
              <div className="mt-auto">
              {isCurrentPlan ? (
                <div className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-center text-sm font-medium text-gray-500">
                  Current plan
                </div>
              ) : planId === "free" ? (
                <button
                  onClick={goLanding}
                  className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Continue free
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(planId)}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${
                    isPro
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  Upgrade to {PLAN_LABELS[planId]} →
                </button>
              )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <th className="text-left px-5 py-3 text-gray-500 font-semibold text-[12px] uppercase tracking-wider">Feature</th>
              {["free", "starter", "pro"].map((planId) => (
                <th key={planId} className="text-center px-4 py-3 font-semibold text-[13px]">
                  {PLAN_LABELS[planId]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {FEATURES.map((f) => (
              <tr key={f.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{f.label}</td>
                {["free", "starter", "pro"].map((planId) => {
                  const val = planValue(planId, f.key);
                  const isCheck = val === "✓";
                  const isDash  = val === "—";
                  return (
                    <td key={planId} className="text-center px-4 py-3">
                      {isCheck ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : isDash ? (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      ) : (
                        <span className="text-gray-700 dark:text-gray-300 text-[12px]">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
