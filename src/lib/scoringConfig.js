/**
 * Scoring weight configuration.
 *
 * Edit the numeric values below to tune how the Skill Breakdown is computed.
 * All downstream code (aggregation in db.js, UI in SkillBreakdown.jsx,
 * tooltip text, growth nudges) reads from here — single source of truth.
 */

export const SCORING_CONFIG = {
  // Multipliers applied to the raw session score BEFORE averaging.
  // A Hard 5/5 stays 5.0; an Easy 5/5 contributes as score × factor.
  difficulty: {
    Easy: 0.5,
    Medium: 0.7,
    Hard: 1.0,
  },

  // Gap-aware streak weighting.
  //
  // Walk sessions newest → oldest, tracking days between consecutive activity:
  //   - Sessions in one continuous streak (no silence > gapThresholdDays
  //     between them, or between the most recent one and "today") share the
  //     same running weight — full 1.0 if the streak reaches today.
  //   - When a silence exceeds gapThresholdDays, the running weight gets
  //     multiplied by penaltyPerGapUnit for each gapUnitDays of EXTRA silence.
  //     That penalty applies to every session older than the gap.
  //   - Weight floors at `floor`.
  //
  // Example (gapThresholdDays=14, gapUnitDays=14, penaltyPerGapUnit=0.7):
  //   - 30 sessions in last 2 months, no gap > 14 days   → all weight 1.0
  //   - + 4 weeks off, just came back today              → today=1.0, old 30 → 0.49
  //   - 2 weeks off (right at threshold)                 → still 1.0
  //   - 3 weeks off                                      → old × 0.7^(7/14) ≈ 0.84
  //
  // `maxSessions` is a hard cap — only the most recent N completed sessions
  // (across all tracks combined) are pulled from the DB.
  streak: {
    gapThresholdDays: 14,
    gapUnitDays: 14,
    penaltyPerGapUnit: 0.7,
    floor: 0.2,
    maxSessions: 50,
  },

  // Time pressure — penalize sessions that ran over the budgeted duration.
  // Each track has its own minute budget. A session that takes longer than
  // the budget gets its score multiplied by:
  //   timeFactor = max(floor, 1 − penaltyRate × fractionOver)
  // where fractionOver = (durationSeconds / budgetSeconds) − 1.
  //
  // Examples (budget=35 min, penaltyRate=0.6, floor=0.5):
  //   ≤ 35 min → 1.00         (no penalty)
  //     40 min → 0.91         (~9% — borderline)
  //     45 min → 0.83
  //     60 min → 0.57
  //     70+ min → 0.50        (floored)
  time: {
    budgetMinutesByTrack: {
      system_design:    35,
      behavioral:       35,
      problem_solving:  35,
      low_level_design: 35,
    },
    penaltyRate: 0.6,
    floor: 0.5,
  },

  // When to show the "try a Hard problem" growth nudge.
  nudge: {
    minSessions: 1,       // wait until user has at least this many sessions in the track
    hardRatioFloor: 0.25, // if Hard ratio is below this, suggest more Hards
  },
};

// ─── Helpers ──────────────────────────────────────────────────────

/** Score factor for a given difficulty string. Falls back to Medium. */
export function getDifficultyFactor(difficulty) {
  return SCORING_CONFIG.difficulty[difficulty] ?? SCORING_CONFIG.difficulty.Medium;
}

/** Time-pressure factor for a session. 1.0 if on or under budget. */
export function getTimeFactor(track, durationSeconds) {
  const { budgetMinutesByTrack, penaltyRate, floor } = SCORING_CONFIG.time;
  const budgetMin = budgetMinutesByTrack[track] ?? 35;
  const budgetSec = budgetMin * 60;
  if (!durationSeconds || durationSeconds <= budgetSec) return 1.0;
  const fractionOver = (durationSeconds - budgetSec) / budgetSec;
  return Math.max(floor, 1 - penaltyRate * fractionOver);
}

/**
 * Returns metadata about a session's time performance — useful for UI chips.
 * status is one of: "on-time" | "borderline" | "over" | "way-over"
 */
export function getTimeStatus(track, durationSeconds) {
  const { budgetMinutesByTrack } = SCORING_CONFIG.time;
  const budgetMin = budgetMinutesByTrack[track] ?? 35;
  const durationMin = durationSeconds ? durationSeconds / 60 : 0;
  const overMin = durationMin - budgetMin;
  const fractionOver = budgetMin > 0 ? overMin / budgetMin : 0;
  let status;
  if (overMin <= 0) status = "on-time";
  else if (fractionOver < 0.2) status = "borderline";
  else if (fractionOver < 0.6) status = "over";
  else status = "way-over";
  return { budgetMin, durationMin, overMin, fractionOver, status, factor: getTimeFactor(track, durationSeconds) };
}

/**
 * Compute streak-aware weights for a list of sessions (NEWEST FIRST).
 * Returns a Map<sessionId, weight>.
 *
 * Pass `now` for deterministic tests; defaults to Date.now().
 */
export function computeStreakWeights(sessions, now = Date.now()) {
  const { gapThresholdDays, gapUnitDays, penaltyPerGapUnit, floor } = SCORING_CONFIG.streak;
  const weights = new Map();
  let runningPenalty = 1.0;
  let prevTime = now;

  for (const s of sessions) {
    if (!s.completed_at) {
      weights.set(s.id, runningPenalty);
      continue;
    }
    const sessionTime = new Date(s.completed_at).getTime();
    const daysSincePrev = Math.max(0, (prevTime - sessionTime) / 86_400_000);

    if (daysSincePrev > gapThresholdDays) {
      const extraDays = daysSincePrev - gapThresholdDays;
      const gapUnits = extraDays / gapUnitDays;
      runningPenalty *= Math.pow(penaltyPerGapUnit, gapUnits);
      if (runningPenalty < floor) runningPenalty = floor;
    }

    weights.set(s.id, runningPenalty);
    prevTime = sessionTime;
  }
  return weights;
}

/** Human-readable explanation of current weighting — used in the tooltip. */
export function getWeightingDescription() {
  const { difficulty, streak, time } = SCORING_CONFIG;
  return (
    `Each score is adjusted by difficulty ` +
    `(Easy × ${difficulty.Easy}, Medium × ${difficulty.Medium}, Hard × ${difficulty.Hard}) ` +
    `and by time (sessions over a ${time.budgetMinutesByTrack.problem_solving}-min budget lose up to ` +
    `${Math.round((1 - time.floor) * 100)}% to a floor of ${time.floor}×). ` +
    `Sessions within an active streak weigh equally; after silence of more than ` +
    `${streak.gapThresholdDays} days, prior sessions are down-weighted × ` +
    `${streak.penaltyPerGapUnit} for each ${streak.gapUnitDays}-day chunk of extra silence ` +
    `(floors at ${streak.floor}×). Up to ${streak.maxSessions} most-recent sessions are considered.`
  );
}

/**
 * Given the difficulty mix for a track, return a growth nudge (or null).
 * Thresholds come from SCORING_CONFIG.nudge.
 */
export function buildGrowthNudge(counts, trackLabel) {
  const { minSessions, hardRatioFloor } = SCORING_CONFIG.nudge;
  const total = (counts?.Easy || 0) + (counts?.Medium || 0) + (counts?.Hard || 0);
  if (total < minSessions) return null;

  const medium = counts.Medium || 0;
  const hard = counts.Hard || 0;
  const hardRatio = total > 0 ? hard / total : 0;
  const label = (trackLabel || "").toLowerCase();

  if (hard === 0 && medium === 0) {
    return {
      title: "All Easy so far — stretch yourself",
      body: `You've only completed Easy ${label} problems. Pick a Medium or Hard problem to start raising your ceiling.`,
    };
  }
  if (hard === 0) {
    return {
      title: "Next step: a Hard problem",
      body: `You're doing well on Easy and Medium ${label} problems. A Hard one will push your skill ceiling to 5.0 — that's where real growth happens.`,
    };
  }
  if (hardRatio < hardRatioFloor) {
    return {
      title: "Mix in more Hard problems",
      body: `Only ${hard} of your ${total} ${label} sessions were Hard. More Hards will sharpen your ceiling and surface gaps the easier ones don't.`,
    };
  }
  return null;
}
