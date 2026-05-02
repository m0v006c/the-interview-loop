/**
 * Track Registry — each interview track plugs its config here.
 * The store uses TRACKS[trackId] to look up phases, prompts, problems, etc.
 */

import { ALL_PROBLEMS, PROBLEM_CATEGORIES, CREATIVE_PROBLEM_PROMPT } from "./problems";
import { PHASE_PROMPTS, SCORING_PROMPT, FALLBACK_SCORES } from "./prompts";
import {
  BEHAVIORAL_PROBLEMS,
  BEHAVIORAL_CATEGORIES,
  BEHAVIORAL_PHASE_PROMPTS,
  BEHAVIORAL_SCORING_PROMPT,
  BEHAVIORAL_FALLBACK_SCORES,
} from "./behavioral";
import {
  PROBLEM_SOLVING_PROBLEMS,
  PROBLEM_SOLVING_CATEGORIES,
  PROBLEM_SOLVING_PHASE_PROMPTS,
  PROBLEM_SOLVING_SCORING_PROMPT,
  PROBLEM_SOLVING_FALLBACK_SCORES,
  PROBLEM_SOLVING_CREATIVE_PROMPT,
} from "./problem_solving";
import {
  LLD_PROBLEMS,
  LLD_CATEGORIES,
  LLD_PHASE_PROMPTS,
  LLD_SCORING_PROMPT,
  LLD_FALLBACK_SCORES,
  LLD_CREATIVE_PROMPT,
} from "./low_level_design";

export const TRACKS = {
  system_design: {
    id: "system_design",
    label: "System Design",
    firstPhase: "clarify",
    phases: ["clarify", "api_design", "design", "deep_dive", "scale"],
    nextPhase: {
      clarify: "api_design",
      api_design: "design",
      design: "deep_dive",
      deep_dive: "scale",
    },
    phaseConfig: {
      clarify: { label: "Clarify", color: "#6366F1", num: 1 },
      api_design: { label: "API Design", color: "#0EA5E9", num: 2 },
      design: { label: "Design", color: "#10B981", num: 3 },
      deep_dive: { label: "Deep dive", color: "#EF4444", num: 4 },
      scale: { label: "Scale", color: "#F59E0B", num: 5 },
    },
    problems: ALL_PROBLEMS,
    categories: PROBLEM_CATEGORIES,
    creativePrompt: CREATIVE_PROBLEM_PROMPT,
    prompts: PHASE_PROMPTS,
    scoringPrompt: SCORING_PROMPT,
    fallbackScores: FALLBACK_SCORES,
    initialMessage: (problem) =>
      `Alright, let's get started. Here's your problem:\n\n"${problem.description}"\n\nTake it from here.`,
  },

  behavioral: {
    id: "behavioral",
    label: "Behavioral",
    firstPhase: "warmup",
    phases: ["warmup", "stories", "project_dive", "wrapup"],
    nextPhase: {
      warmup: "stories",
      stories: "project_dive",
      project_dive: "wrapup",
    },
    phaseConfig: {
      warmup: { label: "Warm-up", color: "#6366F1", num: 1 },
      stories: { label: "Stories", color: "#EC4899", num: 2 },
      project_dive: { label: "Project Deep-dive", color: "#10B981", num: 3 },
      wrapup: { label: "Wrap-up", color: "#F59E0B", num: 4 },
    },
    problems: BEHAVIORAL_PROBLEMS,
    categories: BEHAVIORAL_CATEGORIES,
    creativePrompt: null,
    prompts: BEHAVIORAL_PHASE_PROMPTS,
    scoringPrompt: BEHAVIORAL_SCORING_PROMPT,
    fallbackScores: BEHAVIORAL_FALLBACK_SCORES,
    initialMessage: (problem) =>
      `Hey, nice to meet you. I'm going to be your interviewer today. This round is focused on ${problem.focus}. Before we get into questions, why don't you start with a quick intro — your background, what you're working on now, that kind of thing?`,
  },

  problem_solving: {
    id: "problem_solving",
    label: "Problem Solving",
    firstPhase: "clarify",
    phases: ["clarify", "approach", "implement", "test"],
    nextPhase: {
      clarify: "approach",
      approach: "implement",
      implement: "test",
    },
    phaseConfig: {
      clarify:   { label: "Clarify",   color: "#6366F1", num: 1 },
      approach:  { label: "Approach",  color: "#0EA5E9", num: 2 },
      implement: { label: "Implement", color: "#10B981", num: 3 },
      test:      { label: "Test",      color: "#F59E0B", num: 4 },
    },
    problems: PROBLEM_SOLVING_PROBLEMS,
    categories: PROBLEM_SOLVING_CATEGORIES,
    creativePrompt: PROBLEM_SOLVING_CREATIVE_PROMPT,
    prompts: PROBLEM_SOLVING_PHASE_PROMPTS,
    scoringPrompt: PROBLEM_SOLVING_SCORING_PROMPT,
    fallbackScores: PROBLEM_SOLVING_FALLBACK_SCORES,
    initialMessage: (problem) =>
      `Alright, here's your problem:\n\n"${problem.description}"\n\nGo ahead — feel free to ask clarifying questions before diving in. Use the notepad on the right when you're ready to code.`,
  },

  low_level_design: {
    id: "low_level_design",
    label: "Low-Level Design",
    firstPhase: "clarify",
    phases: ["clarify", "entities", "design", "implement", "evolve"],
    nextPhase: {
      clarify: "entities",
      entities: "design",
      design: "implement",
      implement: "evolve",
    },
    phaseConfig: {
      clarify: { label: "Clarify", color: "#6366F1", num: 1 },
      entities: { label: "Entities", color: "#EC4899", num: 2 },
      design: { label: "Design", color: "#10B981", num: 3 },
      implement: { label: "Implement", color: "#0EA5E9", num: 4 },
      evolve: { label: "Evolve", color: "#F59E0B", num: 5 },
    },
    problems: LLD_PROBLEMS,
    categories: LLD_CATEGORIES,
    creativePrompt: LLD_CREATIVE_PROMPT,
    prompts: LLD_PHASE_PROMPTS,
    scoringPrompt: LLD_SCORING_PROMPT,
    fallbackScores: LLD_FALLBACK_SCORES,
    initialMessage: (problem) =>
      `Great, let's design this together.\n\n"${problem.description}"\n\nStart by asking any clarifying questions you have about scope and use cases. Use the notepad on the right to sketch class definitions as we go.`,
  },
};

export function getTrack(id) {
  return TRACKS[id] || TRACKS.system_design;
}
