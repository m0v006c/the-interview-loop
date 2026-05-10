import { useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { getRandomProblem } from "@/data/problems";
import { TRACKS } from "@/data/tracks";
import { usePlan } from "@/lib/usePlan";
import UpgradePrompt from "@/components/UpgradePrompt";

export default function HomeScreen() {
  const { startInterview, startCreative, isLoading, homeTrack } = useInterviewStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { visibleQuestionsPerTrack, canUseAIProblem, aiProblemReason, aiProblemCta, planId, interviewsRemaining } = usePlan();

  const trackId = homeTrack || "system_design";
  const trackCfg = TRACKS[trackId];

  const filteredProblems = (() => {
    let pool =
      activeCategory === "all"
        ? trackCfg.problems
        : trackCfg.categories.find((c) => c.id === activeCategory)?.problems || [];
    if (difficulty !== "all") pool = pool.filter((p) => p.difficulty === difficulty);
    // Limit visible problems for free users
    if (visibleQuestionsPerTrack && pool.length > visibleQuestionsPerTrack) {
      pool = pool.slice(0, visibleQuestionsPerTrack);
    }
    return pool;
  })();

  const isLimited = visibleQuestionsPerTrack !== null; // true = free tier
  const hiddenCount = isLimited
    ? (activeCategory === "all" ? trackCfg.problems.length : (trackCfg.categories.find(c => c.id === activeCategory)?.problems.length || 0)) - (visibleQuestionsPerTrack || 0)
    : 0;

  const handleRandom = () => {
    if (trackId === "system_design") {
      const opts = {};
      if (activeCategory !== "all") opts.category = activeCategory;
      if (difficulty !== "all") opts.difficulty = difficulty;
      startInterview(getRandomProblem(opts), "system_design");
    } else {
      const pool = filteredProblems.length > 0 ? filteredProblems : trackCfg.problems;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      startInterview(pick, trackId);
    }
  };

  const isSD = trackId === "system_design";
  const TRACK_META = {
    system_design:    { icon: "🏛️", accent: "indigo", bg: "bg-indigo-100 dark:bg-indigo-500/20" },
    behavioral:       { icon: "💬", accent: "pink",   bg: "bg-pink-100 dark:bg-pink-500/20" },
    problem_solving:  { icon: "🧩", accent: "sky",    bg: "bg-sky-100 dark:bg-sky-500/20" },
    low_level_design: { icon: "🧱", accent: "emerald", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
  };
  const meta = TRACK_META[trackId] || TRACK_META.system_design;
  const accent = meta.accent;
  const ICON = meta.icon;

  const BLURBS = {
    system_design:    `Practice system design interviews with an AI interviewer that cross-questions, deep dives, and scores you — ${trackCfg.problems.length} problems across ${trackCfg.categories.length} categories.`,
    behavioral:       `Conversational behavioral round. Voice-first, STAR-probed, and scored across 6 dimensions with per-question feedback — ${trackCfg.problems.length} prompts across ${trackCfg.categories.length} categories.`,
    problem_solving:  `Coding challenges with clarify → approach → implement → test → optimize flow. Problems are grouped by company focus (Amazon graphs, Google DP, Meta strings, etc.) — ${trackCfg.problems.length} problems.`,
    low_level_design: `Object-oriented design with real classes, patterns, and SOLID principles. Classic problems like parking lot, chess, and LRU cache — ${trackCfg.problems.length} problems.`,
  };
  const blurb = BLURBS[trackId] || BLURBS.system_design;

  return (
    <div className="px-5 py-8">
      <div className="max-w-[820px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className={`w-10 h-10 rounded-xl grid place-items-center text-xl ${meta.bg}`}>
              {ICON}
            </div>
            <span className="text-xl font-semibold">{trackCfg.label}</span>
          </div>
          <p className="text-[15px] text-gray-500 max-w-[520px] mx-auto leading-relaxed">
            {blurb}
          </p>
        </div>

        {/* Action buttons */}
        <div className={`grid gap-3 mb-6 ${trackCfg.creativePrompt ? "grid-cols-2" : "grid-cols-1"}`}>
          {trackCfg.creativePrompt && (
            canUseAIProblem ? (
              <button
                onClick={() => startCreative(trackId)}
                disabled={isLoading}
                className="py-3.5 rounded-xl border-2 border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-600 font-semibold text-sm hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {isLoading ? "Generating..." : (
                  trackId === "system_design"    ? "AI-generated creative problem" :
                  trackId === "problem_solving"  ? "AI-generated coding problem" :
                  trackId === "low_level_design" ? "AI-generated LLD problem" :
                  "AI-generated problem"
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="py-3.5 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-500/30 text-purple-400 font-semibold text-sm hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors flex items-center justify-center gap-2"
              >
                🔒 {trackId === "system_design" ? "AI-generated creative problem" : "AI-generated problem"}
              </button>
            )
          )}
          <button
            onClick={handleRandom}
            className={`py-3.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
              accent === "indigo"
                ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-500/20"
                : accent === "pink"
                ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-500/20"
                : accent === "sky"
                ? "border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-500/20"
                : "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
            }`}
          >
            Random {trackCfg.label.toLowerCase()} problem
          </button>
        </div>

        {/* Category tabs — own row */}
        <div className="mb-2">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Category</div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                activeCategory === "all"
                  ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              All ({trackCfg.problems.length})
            </button>
            {trackCfg.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                  activeCategory === cat.id
                    ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {cat.label} ({cat.problems.length})
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty — own row, segmented control so it's clearly separate */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Difficulty</div>
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
            {[
              { key: "all", label: "Any", activeBg: "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" },
              { key: "Easy", label: "Easy", activeBg: "bg-green-500 text-white" },
              { key: "Medium", label: "Medium", activeBg: "bg-amber-500 text-white" },
              { key: "Hard", label: "Hard", activeBg: "bg-red-500 text-white" },
            ].map((d, i) => (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  difficulty === d.key
                    ? d.activeBg
                    : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                } ${i > 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[13px] text-gray-400 mb-3">
          {filteredProblems.length} problem{filteredProblems.length !== 1 ? "s" : ""}
        </div>

        {/* Problem grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredProblems.map((p) => (
            <button
              key={p.id}
              onClick={() => startInterview(p, trackId)}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-left hover:border-gray-300 dark:hover:border-gray-700 transition-colors group"
            >
              <div className={`text-sm font-medium mb-1.5 transition-colors ${
                accent === "indigo" ? "group-hover:text-indigo-500"
                  : accent === "pink" ? "group-hover:text-pink-500"
                  : accent === "sky" ? "group-hover:text-sky-500"
                  : "group-hover:text-emerald-500"
              }`}>
                {p.title}
              </div>
              <div className="text-[12px] text-gray-400 mb-2 line-clamp-2 leading-relaxed">
                {p.description}
              </div>
              <div className="flex gap-2 text-[11px] flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {p.company}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md ${
                    p.difficulty === "Hard"
                      ? "bg-red-50 text-red-500 dark:bg-red-500/10"
                      : p.difficulty === "Medium"
                      ? "bg-amber-50 text-amber-500 dark:bg-amber-500/10"
                      : "bg-green-50 text-green-500 dark:bg-green-500/10"
                  }`}
                >
                  {p.difficulty}
                </span>
                {p.topics.slice(0, 2).map((t) => (
                  <span key={t} className={`px-2 py-0.5 rounded-md ${
                    accent === "indigo" ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-400"
                      : accent === "pink" ? "bg-pink-50 dark:bg-pink-500/10 text-pink-400"
                      : accent === "sky" ? "bg-sky-50 dark:bg-sky-500/10 text-sky-400"
                      : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {t}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No problems match the current filters. Try a different combination.
          </div>
        )}

        {/* Locked questions notice for free users */}
        {isLimited && hiddenCount > 0 && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="mt-3 w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            🔒 {hiddenCount} more problems locked — upgrade to access all
          </button>
        )}
      </div>

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          variant="modal"
          title="Unlock all problems"
          description={aiProblemReason || `Free plan shows 3 problems per track. Upgrade to access all 50+ problems and AI-generated questions.`}
          cta={aiProblemCta || "View plans →"}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
}
