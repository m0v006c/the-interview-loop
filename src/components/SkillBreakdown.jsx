import { useState } from "react";
import { TRACKS } from "@/data/tracks";
import { useAuthStore } from "@/lib/authStore";
import { buildGrowthNudge } from "@/lib/scoringConfig";
import WeightingInfoModal from "@/components/WeightingInfoModal";

/** Dimensions per track — these keys match the scoring prompt JSON. */
const DIMENSIONS_BY_TRACK = {
  system_design: [
    { key: "requirements", label: "Requirements gathering" },
    { key: "high_level_design", label: "High-level design" },
    { key: "deep_dive_depth", label: "Deep dive depth" },
    { key: "trade_offs", label: "Trade-off analysis" },
    { key: "scaling_evolution", label: "Scaling & evolution" },
    { key: "scalability", label: "Scalability thinking" },
    { key: "communication", label: "Communication" },
  ],
  behavioral: [
    { key: "star_structure", label: "STAR structure" },
    { key: "specificity", label: "Specificity" },
    { key: "ownership_impact", label: "Ownership & impact" },
    { key: "collaboration", label: "Collaboration" },
    { key: "self_awareness", label: "Self-awareness" },
    { key: "communication", label: "Communication" },
  ],
  problem_solving: [
    { key: "clarification", label: "Clarification" },
    { key: "approach_complexity", label: "Approach & complexity" },
    { key: "code_quality", label: "Code quality" },
    { key: "testing_edge_cases", label: "Testing & edge cases" },
    { key: "optimization_depth", label: "Optimization depth" },
  ],
  low_level_design: [
    { key: "clarification", label: "Clarification" },
    { key: "entity_modeling", label: "Entity modeling" },
    { key: "patterns_solid", label: "Patterns & SOLID" },
    { key: "code_quality", label: "Code quality" },
    { key: "dry_run", label: "Dry run" },
    { key: "extensibility", label: "Extensibility" },
  ],
};

const TRACK_ORDER = ["system_design", "behavioral", "problem_solving", "low_level_design"];


export default function SkillBreakdown({ skillData, loading }) {
  const [activeTab, setActiveTab] = useState("system_design");
  const [infoOpen, setInfoOpen] = useState(false);
  const cfg = TRACKS[activeTab];
  const dims = DIMENSIONS_BY_TRACK[activeTab] || [];
  const trackStats = skillData?.[activeTab];
  const user = useAuthStore((s) => s.user);
  const openSignIn = useAuthStore((s) => s.openSignIn);

  const nudge = trackStats
    ? buildGrowthNudge(trackStats.difficultyCounts, cfg?.label || "")
    : null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-semibold tracking-tight">Skill breakdown</h2>
        <span className="text-xs text-gray-400">Averaged across your scored sessions</span>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        {/* Track tabs */}
        <div className="flex gap-2 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3 flex-wrap">
          {TRACK_ORDER.map((trackId) => {
            const label = TRACKS[trackId]?.label;
            const stats = skillData?.[trackId];
            const isActive = activeTab === trackId;
            return (
              <button
                key={trackId}
                onClick={() => setActiveTab(trackId)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  isActive
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {label}
                {stats && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {stats.sessionCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {!user ? (
          <div className="text-sm text-gray-500 text-center py-8 leading-relaxed">
            <button onClick={openSignIn} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Sign in</button>{" "}
            to see your skill breakdown per track.
          </div>
        ) : loading ? (
          <div className="text-sm text-gray-400 text-center py-6">Loading skill data...</div>
        ) : !trackStats || trackStats.sessionCount === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8 leading-relaxed">
            No {cfg?.label} sessions completed yet.<br />
            <span className="text-gray-400">Finish a scored {cfg?.label.toLowerCase()} session to see your breakdown here.</span>
          </div>
        ) : (
          <>
            {/* Growth nudge */}
            {nudge && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5">💪</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-amber-900 dark:text-amber-300">
                    {nudge.title}
                  </div>
                  <div className="text-[12px] text-amber-800 dark:text-amber-400 mt-0.5 leading-relaxed">
                    {nudge.body}
                  </div>
                </div>
              </div>
            )}

            {/* Dimension grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3.5 text-sm">
              {dims.map((d) => {
                const dim = trackStats.dimensions[d.key];
                const avg = dim?.avg || 0;
                const pct = (avg / 5) * 100;
                const color = avg >= 4 ? "#10B981" : avg >= 3 ? "#F59E0B" : "#EF4444";
                return (
                  <div key={d.key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                      <span className="text-gray-500 font-medium">
                        {dim ? avg.toFixed(1) : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 gap-3 flex-wrap">
              <span>
                Based on {trackStats.sessionCount} scored session
                {trackStats.sessionCount !== 1 ? "s" : ""}
                {" "}({trackStats.difficultyCounts.Easy || 0}E /{" "}
                {trackStats.difficultyCounts.Medium || 0}M /{" "}
                {trackStats.difficultyCounts.Hard || 0}H) · overall avg{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {trackStats.avgScore.toFixed(1)}/5
                </span>
              </span>
              <button
                onClick={() => setInfoOpen(true)}
                className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline-offset-2 hover:underline"
                title="Click to see how scores are calculated"
              >
                Weighted · difficulty + time + streak ⓘ
              </button>
            </div>
          </>
        )}
      </div>

      <WeightingInfoModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  );
}
