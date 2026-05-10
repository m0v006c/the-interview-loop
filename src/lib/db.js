/**
 * Data Access Layer — all Supabase reads/writes for user data.
 *
 * Tables:
 *   profiles(id, email, display_name, avatar_url, ...)
 *   sessions(id, user_id, track, problem_*, phase, status, transcript, scores, ...)
 *
 * Row-Level Security ensures each user only sees their own rows.
 */

import { supabase } from "@/lib/supabase";
import {
  getDifficultyFactor,
  getTimeFactor,
  computeStreakWeights,
  SCORING_CONFIG,
} from "@/lib/scoringConfig";

// ─── Profiles & Plan ──────────────────────────────────────────────

export async function getProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) { console.warn("[db] getProfile:", error.message); return null; }
  return data;
}

/**
 * Increment interview usage counter for the month.
 * Resets counters automatically when the month changes.
 * Returns updated profile or null on error.
 */
export async function incrementInterviewUsage(userId) {
  if (!supabase || !userId) return null;
  const { currentUsageMonth } = await import("@/lib/planConfig");
  const month = currentUsageMonth();

  // Fetch current usage
  const { data: profile } = await supabase
    .from("profiles")
    .select("interviews_this_month, usage_month")
    .eq("id", userId)
    .maybeSingle();

  const needsReset = profile?.usage_month !== month;
  const updates = needsReset
    ? { interviews_this_month: 1, ai_problems_this_month: 0, usage_month: month }
    : { interviews_this_month: (profile?.interviews_this_month || 0) + 1 };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (error) { console.warn("[db] incrementInterviewUsage:", error.message); return null; }
  return data;
}

/**
 * Increment AI problem usage counter.
 * Also increments lifetime total (used for free tier limit).
 */
export async function incrementAIProblemUsage(userId) {
  if (!supabase || !userId) return null;
  const { currentUsageMonth } = await import("@/lib/planConfig");
  const month = currentUsageMonth();

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_problems_this_month, ai_problems_used_total, usage_month")
    .eq("id", userId)
    .maybeSingle();

  const needsReset = profile?.usage_month !== month;
  const updates = needsReset
    ? {
        ai_problems_this_month: 1,
        ai_problems_used_total: (profile?.ai_problems_used_total || 0) + 1,
        usage_month: month,
      }
    : {
        ai_problems_this_month: (profile?.ai_problems_this_month || 0) + 1,
        ai_problems_used_total: (profile?.ai_problems_used_total || 0) + 1,
      };

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (error) { console.warn("[db] incrementAIProblemUsage:", error.message); return null; }
  return data;
}

/** Admin/testing: manually set a user's plan. */
export async function setUserPlan(userId, plan) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .update({ plan })
    .eq("id", userId)
    .select()
    .maybeSingle();
  if (error) { console.warn("[db] setUserPlan:", error.message); return null; }
  return data;
}

/** Weekly skill trend data for advanced analytics. */
export async function getSkillTrends(userId, track) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from("sessions")
    .select("completed_at, scores, problem_meta")
    .eq("user_id", userId)
    .eq("track", track)
    .eq("status", "completed")
    .order("completed_at", { ascending: true })
    .limit(100);
  if (error) { console.warn("[db] getSkillTrends:", error.message); return []; }
  return data || [];
}

// ─── Sessions ─────────────────────────────────────────────────────

/** Create a new in-progress session row when an interview starts. */
export async function createSession({ userId, track, problem, phase }) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      track,
      problem_id: problem.id,
      problem_title: problem.title,
      problem_description: problem.description,
      problem_meta: {
        company: problem.company,
        difficulty: problem.difficulty,
        topics: problem.topics,
        focus: problem.focus,
      },
      phase,
      max_phase_reached: phase,
      status: "in_progress",
      transcript: [],
    })
    .select()
    .single();
  if (error) { console.warn("[db] createSession:", error.message); return null; }
  return data;
}

/**
 * Patch an existing session — transcript, notepad, phase, etc.
 * Caller passes only the fields that changed.
 */
export async function patchSession(sessionId, patch) {
  if (!supabase || !sessionId) return null;
  const { error } = await supabase.from("sessions").update(patch).eq("id", sessionId);
  if (error) console.warn("[db] patchSession:", error.message);
}

/** Mark a session complete and attach final scores + duration. */
export async function completeSession(sessionId, { scores, durationSeconds }) {
  if (!supabase || !sessionId) return;
  const { error } = await supabase
    .from("sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      duration_seconds: durationSeconds ?? 0,
      scores: scores ?? null,
    })
    .eq("id", sessionId);
  if (error) console.warn("[db] completeSession:", error.message);
}

/** Mark any in-progress sessions for a given track as abandoned. */
export async function abandonInProgressForTrack(userId, track, exceptId) {
  if (!supabase || !userId) return;
  let q = supabase
    .from("sessions")
    .update({ status: "abandoned" })
    .eq("user_id", userId)
    .eq("track", track)
    .eq("status", "in_progress");
  if (exceptId) q = q.neq("id", exceptId);
  const { error } = await q;
  if (error) console.warn("[db] abandonInProgressForTrack:", error.message);
}

/**
 * List in-progress sessions — at most one per track (most recent wins).
 * Returns array of session rows sorted by updated_at desc.
 */
export async function listInProgressSessions(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("updated_at", { ascending: false });
  if (error) { console.warn("[db] listInProgressSessions:", error.message); return []; }
  // Keep only most-recent per track
  const seen = new Set();
  const result = [];
  for (const row of data) {
    if (seen.has(row.track)) continue;
    seen.add(row.track);
    result.push(row);
  }
  return result;
}

/**
 * List completed + abandoned sessions for the History page. Newest first.
 * (In-progress sessions are excluded — they live on the dedicated In Progress page.)
 */
export async function listHistorySessions(userId, { limit = 200 } = {}) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["completed", "abandoned"])
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) { console.warn("[db] listHistorySessions:", error.message); return []; }
  return data || [];
}

/** List completed sessions (optionally filter by track). Newest first. */
export async function listCompletedSessions(userId, { track, limit = 50 } = {}) {
  if (!supabase || !userId) return [];
  let q = supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(limit);
  if (track) q = q.eq("track", track);
  const { data, error } = await q;
  if (error) { console.warn("[db] listCompletedSessions:", error.message); return []; }
  return data || [];
}

/** Fetch full session by id (used on Resume). */
export async function getSession(sessionId) {
  if (!supabase || !sessionId) return null;
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) { console.warn("[db] getSession:", error.message); return null; }
  return data;
}

/**
 * Aggregate scores across completed sessions, grouped by track.
 * Returns per-track:
 *   { sessionCount, avgScore, dimensions, difficultyCounts }
 *
 * Weighting is driven by src/lib/scoringConfig.js — edit that file to tune.
 *   - Each score is multiplied by a difficulty factor (Easy/Medium/Hard)
 *   - Sessions get a STREAK-AWARE weight per track:
 *       active streak → equal weight; silence > 14 days → prior sessions decay
 *   - difficultyCounts feeds the growth-nudge in SkillBreakdown
 */
export async function getSkillBreakdown(userId) {
  const completed = await listCompletedSessions(userId, {
    limit: SCORING_CONFIG.streak.maxSessions,
  });

  // Group sessions by track first (already newest-first from the query)
  const sessionsByTrack = {};
  for (const s of completed) {
    if (!sessionsByTrack[s.track]) sessionsByTrack[s.track] = [];
    sessionsByTrack[s.track].push(s);
  }

  const result = {};
  for (const [track, sessions] of Object.entries(sessionsByTrack)) {
    // Compute streak weights INDEPENDENTLY per track — a long silence on one
    // track shouldn't penalize another track the user is still active in.
    const streakWeights = computeStreakWeights(sessions);

    const dims = {};
    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    let sessionCount = 0;

    for (const s of sessions) {
      const scores = s.scores?.scores;
      if (!scores) continue;
      sessionCount += 1;
      const difficulty = s.problem_meta?.difficulty || "Medium";
      const diffFactor = getDifficultyFactor(difficulty);
      const timeFactor = getTimeFactor(track, s.duration_seconds);
      const weight = streakWeights.get(s.id) ?? 1.0;

      if (difficultyCounts[difficulty] !== undefined) difficultyCounts[difficulty] += 1;

      for (const [dim, payload] of Object.entries(scores)) {
        if (typeof payload?.score !== "number") continue;
        const adjustedScore = payload.score * diffFactor * timeFactor;
        if (!dims[dim]) dims[dim] = { weightedSum: 0, weightSum: 0, count: 0 };
        dims[dim].weightedSum += adjustedScore * weight;
        dims[dim].weightSum += weight;
        dims[dim].count += 1;
      }
    }

    const dimensions = {};
    let dimMeanSum = 0, dimMeanCount = 0;
    for (const [k, v] of Object.entries(dims)) {
      const avg = v.weightSum > 0 ? v.weightedSum / v.weightSum : 0;
      dimensions[k] = { avg, count: v.count };
      dimMeanSum += avg;
      dimMeanCount += 1;
    }
    result[track] = {
      sessionCount,
      avgScore: dimMeanCount ? dimMeanSum / dimMeanCount : 0,
      dimensions,
      difficultyCounts,
    };
  }
  return result;
}

// ─── Analytics Reports ────────────────────────────────────────────

/** ISO week key, e.g. "2026-W19" — used to cache one report per user per week. */
export function currentWeekKey() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Fetch the most recent analytics report for this user (any week). */
export async function getLatestAnalyticsReport(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("analytics_reports")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) { console.warn("[db] getLatestAnalyticsReport:", error.message); return null; }
  return data;
}

/** Upsert a weekly report — replaces the row if the same user+week_key already exists. */
export async function saveAnalyticsReport(userId, weekKey, report, sessionsAnalyzed) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("analytics_reports")
    .upsert(
      { user_id: userId, week_key: weekKey, report, sessions_analyzed: sessionsAnalyzed, generated_at: new Date().toISOString() },
      { onConflict: "user_id,week_key" }
    )
    .select()
    .maybeSingle();
  if (error) { console.warn("[db] saveAnalyticsReport:", error.message); return null; }
  return data;
}
