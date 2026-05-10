import { useInterviewStore } from "@/lib/store";

export const DIMENSIONS_BY_TRACK = {
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

const VERDICT_COLORS = {
  STRONG_HIRE: "#059669",
  HIRE: "#10B981",
  LEAN_HIRE: "#F59E0B",
  LEAN_NO_HIRE: "#F97316",
  NO_HIRE: "#EF4444",
};

function ScoreBar({ score }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function ScoreCard({ scores }) {
  const track = useInterviewStore((s) => s.track);
  const DIMENSIONS = DIMENSIONS_BY_TRACK[track] || DIMENSIONS_BY_TRACK.system_design;

  if (!scores) return null;

  const vc = VERDICT_COLORS[scores.overall_verdict] || VERDICT_COLORS.LEAN_HIRE;
  const presentDims = DIMENSIONS.filter((d) => scores.scores?.[d.key]);
  const avg = presentDims.length
    ? presentDims.reduce((s, d) => s + (scores.scores[d.key]?.score || 0), 0) / presentDims.length
    : 0;

  const perStory = Array.isArray(scores.per_story) ? scores.per_story : [];

  return (
    <div className="p-5">
      {/* Verdict badge */}
      <div className="text-center mb-6">
        <span className="inline-block px-5 py-1.5 rounded-full text-white font-semibold text-[15px] tracking-wide"
          style={{ background: vc }}>
          {scores.overall_verdict?.replace(/_/g, " ")}
        </span>
        <div className="mt-2 text-[28px] font-semibold">
          {avg.toFixed(1)} / 5.0
        </div>
      </div>

      {/* Dimension scores */}
      <div className="space-y-3 mb-5">
        {presentDims.map((d) => {
          const s = scores.scores[d.key];
          return (
            <div key={d.key}>
              <div className="flex justify-between text-[13px] mb-1">
                <span className="text-gray-500">{d.label}</span>
                <span className="font-medium">{s.score}/5</span>
              </div>
              <ScoreBar score={s.score} />
              <div className="text-[12px] text-gray-400 mt-0.5">{s.feedback}</div>
            </div>
          );
        })}
      </div>

      {/* Per-question breakdown (behavioral) */}
      {perStory.length > 0 && (
        <div className="mb-5">
          <div className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Question-by-question feedback
          </div>
          <div className="space-y-2">
            {perStory.map((s, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                      Q{i + 1}{s.behavior ? ` · ${s.behavior}` : ""}
                    </div>
                    <div className="text-[13px] text-gray-700 dark:text-gray-300 mt-0.5 leading-snug">
                      {s.question}
                    </div>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                    style={{
                      background: (s.score >= 4 ? "#10B981" : s.score >= 3 ? "#F59E0B" : "#EF4444") + "20",
                      color: s.score >= 4 ? "#10B981" : s.score >= 3 ? "#F59E0B" : "#EF4444",
                    }}
                  >
                    {s.score}/5
                  </span>
                </div>
                {s.strength && (
                  <div className="text-[12px] text-green-600 dark:text-green-400 leading-snug">
                    <span className="font-medium">✓ </span>{s.strength}
                  </div>
                )}
                {s.improvement && (
                  <div className="text-[12px] text-amber-600 dark:text-amber-400 leading-snug mt-0.5">
                    <span className="font-medium">△ </span>{s.improvement}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 mb-3 text-sm leading-relaxed">
        {scores.summary}
      </div>

      {/* Strength + improvement */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-green-50 dark:bg-green-500/10 rounded-xl p-3">
          <div className="text-[12px] text-green-600 font-medium">Top strength</div>
          <div className="text-[13px] mt-1">{scores.top_strength}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3">
          <div className="text-[12px] text-amber-600 font-medium">Top improvement</div>
          <div className="text-[13px] mt-1">{scores.top_improvement}</div>
        </div>
      </div>
    </div>
  );
}
