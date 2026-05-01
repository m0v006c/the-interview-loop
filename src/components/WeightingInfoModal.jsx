import { useEffect } from "react";
import { SCORING_CONFIG } from "@/lib/scoringConfig";

/**
 * Detailed breakdown of how skill scores are weighted.
 * Pulls all numbers from scoringConfig.js so it stays in sync.
 */
export default function WeightingInfoModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const { difficulty, streak, time, nudge } = SCORING_CONFIG;

  // Live-computed streak examples using the actual config
  const computeStreakWeight = (gapDays) => {
    if (gapDays <= streak.gapThresholdDays) return 1.0;
    const extra = gapDays - streak.gapThresholdDays;
    const units = extra / streak.gapUnitDays;
    return Math.max(streak.floor, Math.pow(streak.penaltyPerGapUnit, units));
  };

  const examples = [
    { label: `Daily activity, no gap > ${streak.gapThresholdDays}d`, weight: 1.0 },
    { label: `${streak.gapThresholdDays + 7}-day silence, just back`, weight: computeStreakWeight(streak.gapThresholdDays + 7) },
    { label: `4 weeks off, just back`, weight: computeStreakWeight(28) },
    { label: `8 weeks off, just back`, weight: computeStreakWeight(56) },
    { label: `1+ year of inactivity`, weight: streak.floor },
  ];

  // Live-computed time examples (using PS budget as the canonical example)
  const computeTimeFactor = (durationMin) => {
    const budgetMin = time.budgetMinutesByTrack.problem_solving;
    if (durationMin <= budgetMin) return 1.0;
    const fractionOver = (durationMin - budgetMin) / budgetMin;
    return Math.max(time.floor, 1 - time.penaltyRate * fractionOver);
  };
  const psBudget = time.budgetMinutesByTrack.problem_solving;
  const timeExamples = [
    { label: `${psBudget - 5} min (under)`, factor: computeTimeFactor(psBudget - 5) },
    { label: `${psBudget} min (on time)`, factor: 1.0 },
    { label: `${psBudget + 5} min (borderline)`, factor: computeTimeFactor(psBudget + 5) },
    { label: `${psBudget + 10} min`, factor: computeTimeFactor(psBudget + 10) },
    { label: `${psBudget + 25} min`, factor: computeTimeFactor(psBudget + 25) },
    { label: `${psBudget * 2} min (way over)`, factor: computeTimeFactor(psBudget * 2) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="text-base font-semibold tracking-tight">How your skill score is calculated</div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 text-sm">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            Your overall score reflects four things at once: <strong>how well</strong> you performed,{" "}
            <strong>how challenging</strong> the problems were, <strong>how fast</strong> you finished, and{" "}
            <strong>how recently</strong> you've been practicing.
          </p>

          {/* Difficulty section */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Difficulty adjustment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Each session's score is multiplied by a difficulty factor before averaging — so an Easy 5/5 contributes less than a Hard 5/5.
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Difficulty</th>
                    <th className="text-center px-3 py-2 font-medium">Factor</th>
                    <th className="text-right px-3 py-2 font-medium">5/5 contributes as</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {Object.entries(difficulty).map(([d, f]) => (
                    <tr key={d}>
                      <td className="px-3 py-2 font-medium">{d}</td>
                      <td className="text-center px-3 py-2 font-mono text-gray-600 dark:text-gray-400">× {f.toFixed(2)}</td>
                      <td className="text-right px-3 py-2 font-mono">{(5 * f).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-gray-500 mt-2 leading-relaxed">
              <strong>Implication:</strong> a true 5.0 overall requires mastery on <strong>Hard</strong> problems. Easy/Medium-only practice has a built-in ceiling.
            </p>
          </section>

          {/* Time pressure section */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Time pressure
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Real interviews are bounded — taking too long signals lack of pacing.
              Each track has a budget. Sessions over budget have their score multiplied by a time factor that drops as you go further past the budget.
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden mb-3">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Track</th>
                    <th className="text-right px-3 py-2 font-medium">Budget (minutes)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {Object.entries(time.budgetMinutesByTrack).map(([track, mins]) => (
                    <tr key={track}>
                      <td className="px-3 py-2 font-medium capitalize">{track.replace(/_/g, " ")}</td>
                      <td className="text-right px-3 py-2 font-mono">{mins} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Penalty per fraction-over-budget: <span className="font-mono">× {time.penaltyRate}</span>.
              Floored at <span className="font-mono">× {time.floor}</span> — even a slow correct answer keeps half credit.
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Duration ({psBudget}-min budget)</th>
                    <th className="text-right px-3 py-2 font-medium">Score factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {timeExamples.map((ex, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{ex.label}</td>
                      <td className="text-right px-3 py-2 font-mono">× {ex.factor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Streak section */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Streak weighting
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Sessions inside an <strong>active streak</strong> (no silence longer than {streak.gapThresholdDays} days between them, or between the most recent and today) weigh equally.
              When you take a longer break, prior sessions are <strong>down-weighted</strong> — because skills go stale.
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Specifically: each {streak.gapUnitDays} days of silence beyond the {streak.gapThresholdDays}-day threshold multiplies prior weights by{" "}
              <span className="font-mono">× {streak.penaltyPerGapUnit}</span>. Weights floor at <span className="font-mono">{streak.floor}</span> — even ancient sessions still count a little.
            </p>
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Activity pattern</th>
                    <th className="text-right px-3 py-2 font-medium">Prior sessions weigh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {examples.map((ex, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{ex.label}</td>
                      <td className="text-right px-3 py-2 font-mono">× {ex.weight.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12px] text-gray-500 mt-2 leading-relaxed">
              <strong>Per-track:</strong> streak weighting is computed separately for each track. Daily SD practice doesn't shield you from LLD decay if you haven't done LLD in months.
            </p>
          </section>

          {/* Cap */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Session cap
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Only your <strong>{streak.maxSessions} most-recent completed sessions</strong> are considered. Older history doesn't move the needle anyway given the streak penalty.
            </p>
          </section>

          {/* Nudge */}
          <section>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Hard-problem nudge
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If less than <strong>{Math.round(nudge.hardRatioFloor * 100)}%</strong> of your sessions in a track are Hard, we surface a banner suggesting you try one. Hard problems are the only path to a 5.0 ceiling.
            </p>
          </section>

          {/* Final formula */}
          <section className="bg-gray-50 dark:bg-gray-800/40 rounded-lg p-4 border border-gray-100 dark:border-gray-800">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">The formula</div>
            <div className="font-mono text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
              dimension_avg = Σ (raw_score × difficulty_factor × time_factor × streak_weight)<br/>
              <span className="ml-[8.5rem]">─────────────────────────────────────────────────</span><br/>
              <span className="ml-[14rem]">Σ streak_weight</span>
            </div>
            <div className="text-[11px] text-gray-500 mt-2">
              Overall track score = mean of the dimension averages.
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
