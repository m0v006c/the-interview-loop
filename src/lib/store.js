import { create } from "zustand";
import { callClaude, parseClaudeJSON } from "@/lib/claude";
import { TRACKS, getTrack } from "@/data/tracks";
import { DEFAULT_LANGUAGE_ID, getLanguageLabel } from "@/data/languages";
import { useAuthStore } from "@/lib/authStore";
import * as db from "@/lib/db";
import { loadNotifications, saveNotifications } from "@/lib/notificationStorage";

/** Stop any in-flight AI speech immediately. Called when the interview ends/exits. */
function stopAllSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Wait for the closing TTS message to finish playing, then fire endInterview.
 * Ensures the AI's wrap-up isn't cut off by the scoring-screen transition.
 */
function scheduleAutoEnd(get) {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const MAX_WAIT_MS = 30000; // safety cap: don't wait forever
  const POLL_MS = 500;
  const INITIAL_DELAY = 1200; // let TTS start first

  let elapsed = 0;
  const tick = () => {
    // Still in interview? (user may have manually exited in the meantime)
    if (get().screen !== "interview") return;
    if (synth && (synth.speaking || synth.pending) && elapsed < MAX_WAIT_MS) {
      elapsed += POLL_MS;
      setTimeout(tick, POLL_MS);
      return;
    }
    // Small extra pause for the message to be readable, then end
    setTimeout(() => {
      if (get().screen === "interview") get().endInterview();
    }, 800);
  };
  setTimeout(tick, INITIAL_DELAY);
}

/**
 * Interview Store (Zustand)
 *
 * Track-aware single source of truth. Phases, prompts, and scoring are
 * resolved via the track registry (TRACKS) rather than hard-coded.
 */
export const useInterviewStore = create((set, get) => ({
  // ─── State ───────────────────────────────────────────────────────
  screen: "landing", // "landing"|"home"|"history"|"in_progress"|"learn_hub"|"learn_reading"|"pricing"|"analytics"|"interview"|"scoring"
  feedbackNotifications: [], // [{ id, sessionId, problemTitle, track, createdAt }] — accumulates while user is away
  homeTrack: null, // which track's home page is showing (when screen === "home")
  learnTrack: null,     // "system_design"|"low_level_design"
  learnStageNum: 1,     // which stage (1-based)
  learnTopicIdx: 0,     // which topic within the stage
  track: "system_design", // active track id — looked up in TRACKS
  sessionId: null, // DB row id for the active interview session
  isReviewMode: false, // true when ScoringScreen is viewing a historical session
  notepad: "", // PS / LLD notepad contents (also persisted to DB)
  notepadLanguage: DEFAULT_LANGUAGE_ID, // current Notepad language id (persists across sessions)
  problem: null,
  phase: "clarify",
  messages: [],
  isLoading: false,
  timer: 0,
  timerActive: false,
  canvasElements: [],
  scores: null,
  coveredTopics: [], // generic — tracks either SD topics or behavioral behaviors
  requirements: null, // SD-specific; null on other tracks
  maxPhaseReached: "clarify",
  canvasOpen: false, // behavioral: whiteboard modal open/closed
  voiceEnabled: true,
  autoListen: true,

  // ─── Actions ─────────────────────────────────────────────────────

  setScreen: (screen) => set({ screen }),
  setFeedbackNotifications: (notifications) => set({ feedbackNotifications: notifications }),

  dismissFeedbackNotification: (id) => {
    const userId = useAuthStore.getState().user?.id;
    set((s) => {
      const updated = s.feedbackNotifications.filter((n) => n.id !== id);
      saveNotifications(userId, updated);
      return { feedbackNotifications: updated };
    });
  },

  clearAllFeedbackNotifications: () => {
    const userId = useAuthStore.getState().user?.id;
    saveNotifications(userId, []);
    set({ feedbackNotifications: [] });
  },
  setPhase: (phase) => set({ phase }),
  enterTrackHome: (trackId) => set({ screen: "home", homeTrack: trackId }),
  enterPricing: () => set({ screen: "pricing" }),
  enterAnalytics: () => set({ screen: "analytics" }),
  enterLearnHub: () => set({ screen: "learn_hub" }),
  enterLearnReading: (trackId, stageNum = 1, topicIdx = 0) => set({ screen: "learn_reading", learnTrack: trackId, learnStageNum: stageNum, learnTopicIdx: topicIdx }),
  setLearnTopic: (stageNum, topicIdx) => set({ learnStageNum: stageNum, learnTopicIdx: topicIdx }),
  enterHistory: () => {
    stopAllSpeech();
    set({ screen: "history", isReviewMode: false });
  },
  enterInProgress: () => {
    stopAllSpeech();
    set({ screen: "in_progress", isReviewMode: false });
  },
  // End an in-progress session — marks status=abandoned so it drops off the list.
  endInProgressSession: async (sessionId) => {
    await db.patchSession(sessionId, { status: "abandoned" });
  },
  setCanvasElements: (fn) =>
    set((s) => ({
      canvasElements: typeof fn === "function" ? fn(s.canvasElements) : fn,
    })),
  setVoiceEnabled: (v) => set({ voiceEnabled: v }),
  setAutoListen: (v) => set({ autoListen: v }),
  setCanvasOpen: (v) => set({ canvasOpen: v }),
  setNotepad: (v) => {
    set({ notepad: v });
    const { sessionId } = get();
    if (sessionId) db.patchSession(sessionId, { notepad_content: v });
  },
  setNotepadLanguage: (lang) => set({ notepadLanguage: lang }),
  tickTimer: () => set((s) => ({ timer: s.timer + 1 })),

  /**
   * Start an interview with a specific problem on a specific track.
   */
  startInterview: async (problem, track = "system_design") => {
    // Require sign-in before starting a session (so we can persist progress)
    const user = useAuthStore.getState().user;
    if (!user) {
      useAuthStore.getState().openSignIn();
      return;
    }

    // Check plan limits
    const { canStartInterview: planCheck, currentUsageMonth } = await import("@/lib/planConfig");
    const profile = useAuthStore.getState().profile;
    const planId = profile?.plan || "free";
    const isCurrentMonth = profile?.usage_month === currentUsageMonth();
    const used = isCurrentMonth ? (profile?.interviews_this_month || 0) : 0;
    const check = planCheck(planId, used);
    if (!check.allowed) {
      set({ screen: "pricing" }); // redirect to pricing
      return;
    }

    // Increment usage counter in DB (fire-and-forget)
    const { incrementInterviewUsage } = await import("@/lib/db");
    incrementInterviewUsage(user.id).then((updated) => {
      if (updated) useAuthStore.getState().refreshProfile();
    });

    stopAllSpeech();
    const cfg = getTrack(track);
    const initialMessage = { role: "assistant", content: cfg.initialMessage(problem) };
    set({
      screen: "interview",
      track,
      problem,
      phase: cfg.firstPhase,
      messages: [initialMessage],
      isLoading: false,
      timer: 0,
      timerActive: true,
      canvasElements: [],
      scores: null,
      coveredTopics: [],
      requirements: null,
      maxPhaseReached: cfg.firstPhase,
      canvasOpen: false,
      sessionId: null,
      notepad: "",
      autoListen: track === "behavioral" ? true : get().autoListen,
    });

    // Persist: abandon any other in-progress session for this track, then create a new one.
    await db.abandonInProgressForTrack(user.id, track);
    const row = await db.createSession({
      userId: user.id,
      track,
      problem,
      phase: cfg.firstPhase,
    });
    if (row) {
      set({ sessionId: row.id });
      // Seed transcript with the opening AI message
      db.patchSession(row.id, { transcript: [initialMessage] });
    }
  },

  /**
   * Generate and start an AI-generated problem for any track that has a
   * creativePrompt configured (system_design, problem_solving, low_level_design).
   */
  startCreative: async (trackId = "system_design") => {
    // Check AI problem plan limit
    const { canUseAIProblem, currentUsageMonth } = await import("@/lib/planConfig");
    const profile = useAuthStore.getState().profile;
    const planId  = profile?.plan || "free";
    const isCurrentMonth = profile?.usage_month === currentUsageMonth();
    const usedMonth = isCurrentMonth ? (profile?.ai_problems_this_month || 0) : 0;
    const usedTotal = profile?.ai_problems_used_total || 0;
    const check = canUseAIProblem(planId, usedMonth, usedTotal);
    if (!check.allowed) {
      set({ screen: "pricing" });
      return;
    }
    // Increment AI problem usage (fire-and-forget)
    const user = useAuthStore.getState().user;
    if (user) {
      const { incrementAIProblemUsage } = await import("@/lib/db");
      incrementAIProblemUsage(user.id).then((updated) => {
        if (updated) useAuthStore.getState().refreshProfile();
      });
    }
    const cfg = getTrack(trackId);
    if (!cfg.creativePrompt) return;
    set({ isLoading: true });
    try {
      const resp = await callClaude(
        [{ role: "user", content: cfg.creativePrompt.user }],
        cfg.creativePrompt.system
      );
      const parsed = parseClaudeJSON(resp);
      const problem = {
        id: "creative-" + Date.now(),
        title: parsed.title,
        company: parsed.company || "AI Generated",
        difficulty: parsed.difficulty || "Hard",
        description: parsed.description,
        topics: parsed.topics || [],
        focus: parsed.focus, // only used by behavioral
      };
      await get().startInterview(problem, trackId);
    } catch (e) {
      console.error("Creative problem generation failed:", e);
      // Fallback: random from the track's own bank (keep user on the intended track)
      const pool = cfg.problems;
      const fallback = pool[Math.floor(Math.random() * pool.length)];
      await get().startInterview(fallback, trackId);
    }
    set({ isLoading: false });
  },

  /**
   * Send a user message and get AI response.
   */
  sendMessage: async (text, canvasDescription = "") => {
    const { phase, problem, messages, coveredTopics, track, requirements } = get();
    if (!text.trim() || get().isLoading) return null;

    const cfg = getTrack(track);

    const userMsg = { role: "user", content: text.trim() };
    const newMsgs = [...messages, userMsg];
    set({ messages: newMsgs, isLoading: true });

    // Build phase-specific system prompt via the track's prompt map.
    // Each prompt function accepts args tailored to that phase.
    const builder = cfg.prompts[phase];
    let systemPrompt;
    if (track === "system_design") {
      if (phase === "clarify") systemPrompt = builder(problem);
      else if (phase === "api_design") systemPrompt = builder(problem, requirements);
      else if (phase === "design") systemPrompt = builder(problem, canvasDescription);
      else if (phase === "deep_dive") systemPrompt = builder(problem, canvasDescription, coveredTopics);
      else systemPrompt = builder(problem, canvasDescription, coveredTopics);
    } else if (track === "behavioral") {
      if (phase === "warmup") systemPrompt = builder(problem);
      else if (phase === "stories") systemPrompt = builder(problem, coveredTopics);
      else if (phase === "project_dive") systemPrompt = builder(problem, canvasDescription);
      else systemPrompt = builder(problem);
    } else if (track === "problem_solving") {
      // canvasDescription here == current notepad contents
      if (phase === "clarify" || phase === "approach") systemPrompt = builder(problem);
      else systemPrompt = builder(problem, canvasDescription); // implement + test
    } else if (track === "low_level_design") {
      if (phase === "clarify") systemPrompt = builder(problem);
      else systemPrompt = builder(problem, canvasDescription);
    }

    // Trim to last 20 messages for cost control
    const MAX_CONTEXT = 20;
    const contextMsgs = newMsgs.slice(-MAX_CONTEXT);

    const rawReply = await callClaude(contextMsgs, systemPrompt);

    const hasAdvance = rawReply.includes("<advance/>");
    const wantsCanvas = rawReply.includes("<open-whiteboard/>");
    const hasEnd = rawReply.includes("<end-interview/>");
    const reply = rawReply
      .replace(/\n?<advance\/>/g, "")
      .replace(/\n?<open-whiteboard\/>/g, "")
      .replace(/\n?<end-interview\/>/g, "")
      .trim();

    const finalMsgs = [...newMsgs, { role: "assistant", content: reply }];
    set((s) => ({
      messages: finalMsgs,
      canvasOpen: wantsCanvas ? true : s.canvasOpen,
    }));

    // Persist transcript snapshot + canvas state (fire-and-forget)
    const { sessionId, canvasElements } = get();
    if (sessionId) {
      db.patchSession(sessionId, {
        transcript: finalMsgs,
        phase,
        canvas_elements: canvasElements,
      });
    }

    // ─── Phase transition ───
    if (hasAdvance) {
      const next = cfg.nextPhase[phase];
      if (next) {
        setTimeout(() => {
          set((s) => {
            const updated = {
              phase: next,
              maxPhaseReached:
                cfg.phases.indexOf(next) > cfg.phases.indexOf(s.maxPhaseReached)
                  ? next
                  : s.maxPhaseReached,
            };
            if (s.sessionId) {
              db.patchSession(s.sessionId, {
                phase: updated.phase,
                max_phase_reached: updated.maxPhaseReached,
              });
            }
            return updated;
          });
        }, 500);

        // System-design-specific: extract requirements when leaving clarify
        if (track === "system_design" && phase === "clarify") {
          const allMsgs = finalMsgs;
          extractRequirements(allMsgs, problem, set);
        }
      }
    }

    // ─── Track covered topics (topic detection in text) ───
    // Works for both SD (deep_dive) and behavioral (stories).
    const topicPhase = track === "system_design" ? "deep_dive" : "stories";
    if (phase === topicPhase && problem) {
      const lowerText = text.toLowerCase();
      problem.topics.forEach((topic) => {
        if (lowerText.includes(topic.toLowerCase())) {
          set((s) => {
            if (s.coveredTopics.includes(topic)) return {};
            const next = [...s.coveredTopics, topic];
            if (s.sessionId) db.patchSession(s.sessionId, { covered_topics: next });
            return { coveredTopics: next };
          });
        }
      });
    }

    set({ isLoading: false });

    // ─── Auto-end interview when AI signals it's done ───
    if (hasEnd) scheduleAutoEnd(get);

    return reply;
  },

  /**
   * End the interview and generate scores.
   */
  endInterview: async () => {
    stopAllSpeech();
    const { messages, problem, track, sessionId, timer, notepadLanguage, notepad } = get();
    const cfg = getTrack(track);
    set({ timerActive: false, isLoading: true, screen: "scoring" });

    // Move out of "in_progress" BEFORE the scoring call so In Progress list
    // reflects the correct state immediately. Must be awaited — otherwise the
    // In Progress query races against the patch and wins.
    if (sessionId) await db.patchSession(sessionId, { status: "scoring" });

    const transcriptText = messages
      .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
      .join("\n\n");

    const language = getLanguageLabel(notepadLanguage);

    // For PS and LLD, include notepad content so the scorer evaluates actual code
    const notepadForScoring = (track === "problem_solving" || track === "low_level_design")
      ? notepad?.trim() || null
      : null;

    let finalScores;
    try {
      const result = await callClaude(
        [{ role: "user", content: cfg.scoringPrompt(problem, transcriptText, language, notepadForScoring) }],
        "You are a precise interview scoring system. Respond only with valid JSON, no markdown.",
        4500
      );
      finalScores = parseClaudeJSON(result);
    } catch (e) {
      console.error("Scoring parse failed:", e);
      finalScores = cfg.fallbackScores;
    }

    // Always persist to DB first
    if (sessionId) {
      await db.completeSession(sessionId, { scores: finalScores, durationSeconds: timer });
    }

    // If user is still on scoring screen — update scores in place
    if (get().screen === "scoring") {
      set({ scores: finalScores, isLoading: false });
    } else {
      // User navigated away while evaluation ran — surface a notification
      set((s) => {
        const newNotif = {
          id: Date.now(),
          sessionId,
          problemTitle: problem?.title || "Interview",
          track,
          createdAt: new Date().toISOString(),
        };
        const updated = [...s.feedbackNotifications, newNotif];
        saveNotifications(useAuthStore.getState().user?.id, updated);
        return { isLoading: false, feedbackNotifications: updated };
      });
    }
  },

  /**
   * Re-run scoring for a session that got stuck in status="scoring"
   * (e.g. tab was closed mid-evaluation). Uses the persisted transcript.
   * Only called for sessions whose updated_at is > 2 minutes old to avoid
   * racing with an active tab that is still evaluating the same session.
   */
  rescoreSession: async (sessionRow) => {
    const { id: sessionId, track, transcript, notepad_content, duration_seconds,
            problem_id, problem_title, problem_description, problem_meta } = sessionRow;
    const cfg = getTrack(track);
    if (!cfg || !transcript?.length) return;

    const problem = {
      id: problem_id,
      title: problem_title,
      description: problem_description,
      company: problem_meta?.company,
      difficulty: problem_meta?.difficulty,
      topics: problem_meta?.topics || [],
      focus: problem_meta?.focus,
    };

    const transcriptText = transcript
      .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
      .join("\n\n");

    const notepadForScoring = (track === "problem_solving" || track === "low_level_design")
      ? notepad_content?.trim() || null
      : null;

    let finalScores;
    try {
      const result = await callClaude(
        [{ role: "user", content: cfg.scoringPrompt(problem, transcriptText, null, notepadForScoring) }],
        "You are a precise interview scoring system. Respond only with valid JSON, no markdown.",
        4500
      );
      finalScores = parseClaudeJSON(result);
    } catch (e) {
      console.error("[rescoreSession] scoring failed:", e);
      finalScores = cfg.fallbackScores;
    }

    await db.completeSession(sessionId, { scores: finalScores, durationSeconds: duration_seconds || 0 });

    // Surface notification so user knows feedback is ready
    set((s) => {
      const newNotif = {
        id: Date.now(),
        sessionId,
        problemTitle: problem_title || "Interview",
        track,
        createdAt: new Date().toISOString(),
      };
      const updated = [...s.feedbackNotifications, newNotif];
      saveNotifications(useAuthStore.getState().user?.id, updated);
      return { feedbackNotifications: updated };
    });
  },

  /** Resume an in-progress session from the dashboard. */
  resumeSession: async (sessionId) => {
    const row = await db.getSession(sessionId);
    if (!row) return;
    stopAllSpeech();
    set({
      screen: "interview",
      track: row.track,
      problem: {
        id: row.problem_id,
        title: row.problem_title,
        description: row.problem_description,
        company: row.problem_meta?.company,
        difficulty: row.problem_meta?.difficulty,
        topics: row.problem_meta?.topics || [],
        focus: row.problem_meta?.focus,
      },
      phase: row.phase,
      maxPhaseReached: row.max_phase_reached || row.phase,
      messages: row.transcript || [],
      canvasElements: row.canvas_elements || [],
      notepad: row.notepad_content || "",
      requirements: row.requirements || null,
      coveredTopics: row.covered_topics || [],
      sessionId: row.id,
      timer: row.duration_seconds || 0,
      timerActive: true,
      isLoading: false,
      scores: null,
      canvasOpen: false,
      isReviewMode: false,
      autoListen: row.track === "behavioral" ? true : get().autoListen,
    });
  },

  /**
   * View a historical session on the ScoringScreen in review mode.
   * Used from the History page. Does NOT modify the DB.
   */
  viewSession: async (sessionId) => {
    const row = await db.getSession(sessionId);
    if (!row) return;
    stopAllSpeech();
    set({
      screen: "scoring",
      track: row.track,
      problem: {
        id: row.problem_id,
        title: row.problem_title,
        description: row.problem_description,
        company: row.problem_meta?.company,
        difficulty: row.problem_meta?.difficulty,
        topics: row.problem_meta?.topics || [],
        focus: row.problem_meta?.focus,
      },
      phase: row.phase,
      maxPhaseReached: row.max_phase_reached || row.phase,
      messages: row.transcript || [],
      canvasElements: row.canvas_elements || [],
      notepad: row.notepad_content || "",
      requirements: row.requirements || null,
      coveredTopics: row.covered_topics || [],
      sessionId: row.id,
      timer: row.duration_seconds || 0,
      timerActive: false,
      isLoading: false,
      scores: row.scores || null,
      canvasOpen: false,
      isReviewMode: true,
    });
  },

  /**
   * Re-practice a problem from any past session (completed / abandoned / in_progress).
   * Reconstructs the Problem object from the session row and starts a fresh interview.
   * The one-per-track rule in startInterview handles auto-abandoning any current
   * in-progress session for the same track.
   */
  retrySession: async (sessionRow) => {
    const problem = {
      id: sessionRow.problem_id,
      title: sessionRow.problem_title,
      description: sessionRow.problem_description,
      company: sessionRow.problem_meta?.company,
      difficulty: sessionRow.problem_meta?.difficulty,
      topics: sessionRow.problem_meta?.topics || [],
      focus: sessionRow.problem_meta?.focus,
    };
    await get().startInterview(problem, sessionRow.track);
  },

  /** User abandoned the current session by clicking Exit. Leaves it in_progress in the DB. */
  abandonCurrentSession: () => {
    // No DB call needed — row is already in_progress. Just clear local state.
    // Exit flows (goHome/goLanding) do this automatically.
  },

  // "Practice another" — go back to the track's home page.
  // The DB session is preserved in_progress (or completed if scoring ran).
  goHome: () => {
    stopAllSpeech();
    set((s) => ({
      screen: "home",
      homeTrack: s.homeTrack || s.track || "system_design",
      timerActive: false,
      problem: null,
      messages: [],
      scores: null,
      requirements: null,
      maxPhaseReached: "clarify",
      canvasOpen: false,
      sessionId: null,
      notepad: "",
      isReviewMode: false,
    }));
  },

  // "All tracks" — back to landing
  goLanding: () => {
    stopAllSpeech();
    set({
      screen: "landing",
      homeTrack: null,
      timerActive: false,
      problem: null,
      messages: [],
      scores: null,
      requirements: null,
      maxPhaseReached: "clarify",
      canvasOpen: false,
      sessionId: null,
      notepad: "",
      isReviewMode: false,
    });
  },
}));

/**
 * Fire-and-forget: extract agreed requirements from the clarify conversation.
 * (System design only — no-op on other tracks.)
 */
async function extractRequirements(messages, problem, set) {
  try {
    const result = await callClaude(
      [
        ...messages,
        {
          role: "user",
          content:
            'Summarize ONLY the requirements explicitly agreed on in this conversation as JSON: {"functional": ["..."], "nonfunctional": ["..."], "out_of_scope": ["..."]}. Each item should be a concise one-line bullet. Respond ONLY with valid JSON, no markdown.',
        },
      ],
      `You are extracting agreed requirements from a system design interview clarification for: "${problem.description}". Be concise — 3-6 bullets per category max.`,
      700
    );
    const reqs = parseClaudeJSON(result);
    set((s) => {
      if (s.sessionId) db.patchSession(s.sessionId, { requirements: reqs });
      return { requirements: reqs };
    });
  } catch (e) {
    console.error("Requirements extraction failed:", e);
  }
}
