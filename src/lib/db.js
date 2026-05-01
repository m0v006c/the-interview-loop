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

// ─── Profiles ─────────────────────────────────────────────────────

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
