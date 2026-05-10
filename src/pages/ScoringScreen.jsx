import { useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { getTrack } from "@/data/tracks";
import { getTimeStatus } from "@/lib/scoringConfig";
import KeyMomentsList from "@/components/KeyMomentsList";
import TranscriptCard from "@/components/TranscriptCard";
import ReferenceSolutionModal from "@/components/ReferenceSolutionModal";
import UpgradePrompt from "@/components/UpgradePrompt";
import { usePlan } from "@/lib/usePlan";

const VERDICT_COLORS = {
  STRONG_HIRE: "#059669",
  HIRE: "#10B981",
  LEAN_HIRE: "#F59E0B",
  LEAN_NO_HIRE: "#F97316",
  NO_HIRE: "#EF4444",
};

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

const TIME_CHIP_STYLES = {
  "on-time":   { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/30", label: "On time" },
  "borderline":{ bg: "bg-amber-50 dark:bg-amber-500/10",     text: "text-amber-700 dark:text-amber-400",     border: "border-amber-200 dark:border-amber-500/30",     label: "Borderline" },
  "over":      { bg: "bg-orange-50 dark:bg-orange-500/10",   text: "text-orange-700 dark:text-orange-400",   border: "border-orange-200 dark:border-orange-500/30",   label: "Over budget" },
  "way-over":  { bg: "bg-red-50 dark:bg-red-500/10",         text: "text-red-700 dark:text-red-400",         border: "border-red-200 dark:border-red-500/30",         label: "Way over budget" },
};

function formatDuration(s) {
  if (!s) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function ScoreBar({ score }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function ScoringScreen() {
  const {
    problem, timer, scores, isLoading, goHome, track, messages,
    isReviewMode, enterHistory, sessionId, retrySession,
  } = useInterviewStore();
  const [refOpen, setRefOpen] = useState(false);

  // In review mode, retry needs a session row — reconstruct from current store state
  const handleRetry = () => {
    if (!problem) return;
    retrySession({
      problem_id: problem.id,
      problem_title: problem.title,
      problem_description: problem.description,
      problem_meta: {
        company: problem.company,
        difficulty: problem.difficulty,
        topics: problem.topics,
        focus: problem.focus,
      },
      track,
    });
  };

  const { can, openPricing } = usePlan();
  const canSeeKeyMoments = can("key_moments");
  const canSeeReference  = can("reference_solution");

  const trackCfg = getTrack(track);
  const dims = DIMENSIONS_BY_TRACK[track] || DIMENSIONS_BY_TRACK.system_design;
  const presentDims = scores ? dims.filter((d) => scores.scores?.[d.key]) : [];
  const avg = presentDims.length
    ? presentDims.reduce((s, d) => s + (scores.scores[d.key]?.score || 0), 0) / presentDims.length
    : 0;
  const verdict = scores?.overall_verdict || "LEAN_HIRE";
  const verdictColor = VERDICT_COLORS[verdict] || VERDICT_COLORS.LEAN_HIRE;

  const timeInfo = track ? getTimeStatus(track, timer) : null;
  const chipStyle = timeInfo ? TIME_CHIP_STYLES[timeInfo.status] : null;

  // Skip skeleton treatment in review mode (data is already loaded)
  const evaluating = isLoading && !scores;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={isReviewMode ? enterHistory : goHome}
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 whitespace-nowrap"
          >
            ← {isReviewMode ? "Back to history" : "Back to dashboard"}
          </button>
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
          <div className="text-sm min-w-0 truncate">
            <span className="text-gray-400">{isReviewMode ? "Reviewing · " : "Interview complete · "}</span>
            <span className="font-medium">{problem?.title}</span>
            <span className="text-gray-400 ml-2 hidden md:inline">
              {trackCfg.label} · {problem?.difficulty || "—"} · {formatDuration(timer)}
            </span>
          </div>
          {evaluating && (
            <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 font-medium whitespace-nowrap">
              <span className="w-3 h-3 border-[2px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              Evaluating…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scores?.ideal_solution && (
            canSeeReference ? (
              <button
                onClick={() => setRefOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
              >
                📘 Reference solution
              </button>
            ) : (
              <button
                onClick={openPricing}
                className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                🔒 Reference solution
              </button>
            )
          )}
          <button
            onClick={handleRetry}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Start a fresh session on this same problem"
          >
            ↻ Retry this problem
          </button>
          <button
            onClick={goHome}
            className="px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Practice another →
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
        {/* LEFT: Summary → Key moments → Transcript */}
        <main className="col-span-12 lg:col-span-8 space-y-4">
          {/* Interviewer summary (top) */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Interviewer summary
            </h3>
            {evaluating ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-full" />
                <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-11/12" />
                <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-3/4" />
                <div className="text-[11px] text-gray-400 italic mt-3">
                  Your summary is being prepared…
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {scores?.summary || "No summary available."}
              </p>
            )}
          </div>

          {/* What to work on */}
          <div className="flex items-baseline justify-between pt-2">
            <h2 className="text-lg font-semibold tracking-tight">What to work on</h2>
            <span className="text-xs text-gray-400">
              {evaluating
                ? "Analyzing key moments…"
                : `${scores?.key_moments?.length || 0} key moment${scores?.key_moments?.length === 1 ? "" : "s"}`}
            </span>
          </div>
          {evaluating ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-14 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-3 flex-1 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            canSeeKeyMoments ? (
              <KeyMomentsList moments={scores?.key_moments || []} />
            ) : (
              <UpgradePrompt
                variant="banner"
                description="Unlock key moments feedback — see what you got right and wrong with expected answers."
                cta="Upgrade →"
              />
            )
          )}

          {/* Transcript */}
          <div className="pt-2">
            <TranscriptCard messages={messages} durationSeconds={timer} />
          </div>
        </main>

        {/* RIGHT: Sticky rail */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-6 space-y-4">
            {/* Verdict */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="text-center">
                {evaluating ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[12px] font-medium">
                      <span className="w-2.5 h-2.5 border-[2px] border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                      Evaluating
                    </span>
                    <div className="mt-2 text-[32px] font-semibold text-gray-300 dark:text-gray-600 animate-pulse">
                      — <span className="text-gray-300 dark:text-gray-700 text-lg">/ 5.0</span>
                    </div>
                    <div className="text-xs text-gray-500">Overall score</div>
                  </>
                ) : (
                  <>
                    <span
                      className="inline-block px-4 py-1 rounded-full text-white font-semibold text-[13px] tracking-wide"
                      style={{ background: verdictColor }}
                    >
                      {verdict.replace(/_/g, " ")}
                    </span>
                    <div className="mt-2 text-[32px] font-semibold">
                      {avg.toFixed(1)} <span className="text-gray-400 text-lg">/ 5.0</span>
                    </div>
                    <div className="text-xs text-gray-500">Overall score</div>
                  </>
                )}
              </div>
            </div>

            {/* Skill breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
                Skill breakdown
              </h3>
              {evaluating ? (
                <div className="space-y-2.5 text-sm animate-pulse">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-0.5">
                        <span className="inline-block h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                        <span className="inline-block h-3 w-6 rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5 text-sm">
                  {presentDims.map((d) => {
                    const s = scores.scores[d.key];
                    return (
                      <div key={d.key} title={s.feedback}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                          <span className="text-gray-500 font-medium">{s.score}.0</span>
                        </div>
                        <ScoreBar score={s.score} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Strength + improvement */}
            <div className="space-y-2">
              {evaluating ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 animate-pulse">
                    <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                    <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 mb-1" />
                    <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-2/3" />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-xl p-3.5 animate-pulse">
                    <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                    <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 mb-1" />
                    <div className="h-3 rounded bg-gray-100 dark:bg-gray-800 w-3/4" />
                  </div>
                </>
              ) : (
                <>
                  {scores?.top_strength && (
                    <div className="bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl p-3.5">
                      <div className="text-[11px] uppercase tracking-wider text-green-700 dark:text-green-400 font-semibold mb-1">
                        Top strength
                      </div>
                      <div className="text-[13px] text-green-900 dark:text-green-200 leading-relaxed">
                        {scores.top_strength}
                      </div>
                    </div>
                  )}
                  {scores?.top_improvement && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3.5">
                      <div className="text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold mb-1">
                        Top improvement
                      </div>
                      <div className="text-[13px] text-amber-900 dark:text-amber-200 leading-relaxed">
                        {scores.top_improvement}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stats tile */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-[12px] text-gray-500 space-y-1.5">
              <div className="flex justify-between items-center">
                <span>Duration</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">{formatDuration(timer)}</span>
              </div>
              {timeInfo && chipStyle && (
                <div className="flex justify-between items-center">
                  <span>Time status</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${chipStyle.bg} ${chipStyle.text} ${chipStyle.border}`}>
                    {chipStyle.label}
                    {timeInfo.overMin > 0 && ` · score × ${timeInfo.factor.toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between"><span>Track</span><span className="text-gray-700 dark:text-gray-300 font-medium">{trackCfg.label}</span></div>
              <div className="flex justify-between"><span>Difficulty</span><span className="text-gray-700 dark:text-gray-300 font-medium">{problem?.difficulty || "—"}</span></div>
              <div className="flex justify-between"><span>Messages</span><span className="text-gray-700 dark:text-gray-300 font-medium">{messages?.length || 0}</span></div>
            </div>
          </div>
        </aside>
      </div>

      <ReferenceSolutionModal
        open={refOpen}
        onClose={() => setRefOpen(false)}
        problemTitle={problem?.title}
        idealSolution={scores?.ideal_solution}
      />
    </div>
  );
}
