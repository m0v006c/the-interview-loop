import { useRef, useEffect, useState, useCallback } from "react";
import { useInterviewStore } from "@/lib/store";
import { getTrack } from "@/data/tracks";
import Notepad from "@/components/Notepad";
import ChatPanel from "@/components/ChatPanel";

const PLACEHOLDERS = {
  problem_solving: "// Write your approach, pseudocode, and final code here.\n// Tab to indent · Shift+Tab to outdent\n",
  low_level_design: "// Sketch your classes, methods, and relationships here.\n// Tab to indent · Shift+Tab to outdent\n\nclass Example {\n  // ...\n}\n",
};

/**
 * NotepadInterviewScreen
 *
 * Shared screen for Problem Solving and Low-Level Design tracks.
 * Chat on the left (~30%), plain-text notepad on the right.
 * Notepad contents are surfaced to the AI as the "work surface" each turn.
 */
export default function NotepadInterviewScreen() {
  const {
    problem, phase, setPhase, timer, timerActive,
    endInterview, goHome, tickTimer, track, maxPhaseReached,
    notepad, setNotepad,
  } = useInterviewStore();

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [chatWidthPct, setChatWidthPct] = useState(30);
  const isResizing = useRef(false);

  const trackCfg = getTrack(track);
  const PHASE_CONFIG = trackCfg.phaseConfig;
  const PHASE_ORDER = trackCfg.phases;
  const maxIdx = PHASE_ORDER.indexOf(maxPhaseReached ?? PHASE_ORDER[0]);

  // Timer tick
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [timerActive, tickTimer]);

  // Divider drag
  const handleDividerMouseDown = useCallback((e) => {
    isResizing.current = true;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!isResizing.current) return;
      const pct = (e.clientX / window.innerWidth) * 100;
      setChatWidthPct(Math.max(20, Math.min(55, pct)));
    };
    const onUp = () => { isResizing.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-[13px] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Exit
        </button>

        <div className="text-sm font-medium flex-1 truncate">
          <span className="text-gray-400 mr-1.5">{trackCfg.label} ·</span>
          {problem?.title}
        </div>

        {/* Phase pills */}
        <div className="flex gap-1">
          {Object.entries(PHASE_CONFIG).map(([key, val]) => {
            const phaseIdx = PHASE_ORDER.indexOf(key);
            const isActive = phase === key;
            const isUnlocked = phaseIdx <= maxIdx;
            return (
              <button
                key={key}
                onClick={() => isUnlocked && setPhase(key)}
                disabled={!isUnlocked}
                title={!isUnlocked ? "Complete the current phase to unlock" : undefined}
                className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
                  isActive
                    ? "border-current"
                    : isUnlocked
                    ? "border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                    : "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50"
                }`}
                style={
                  isActive
                    ? { color: val.color, borderColor: val.color, background: val.color + "18" }
                    : {}
                }
              >
                {val.num}. {val.label}
              </button>
            );
          })}
        </div>

        {/* Timer */}
        <div
          className={`font-mono text-sm font-medium min-w-[50px] text-right ${
            timer > 2400 ? "text-red-500" : "text-gray-500"
          }`}
        >
          {formatTime(timer)}
        </div>

        <button
          onClick={() => setShowEndConfirm(true)}
          className="px-3.5 py-1.5 rounded-lg bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 transition-colors"
        >
          End interview
        </button>
      </div>

      {/* Main split — chat left (~30%), notepad right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat (left) */}
        <div
          style={{ width: `${chatWidthPct}%` }}
          className="flex flex-col flex-shrink-0 min-w-0 overflow-hidden"
        >
          <ChatPanel getCanvasDescription={() => notepad} />
        </div>

        {/* Divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-1 flex-shrink-0 hover:w-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-col-resize transition-[width,background-color] duration-100"
        />

        {/* Notepad (right) */}
        <div className="flex-1 flex flex-col min-w-0">
          <Notepad
            value={notepad}
            onChange={setNotepad}
            placeholder={PLACEHOLDERS[track] || ""}
          />
        </div>
      </div>

      {/* End interview confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-base font-semibold mb-1">End this interview?</div>
            <div className="text-sm text-gray-500 mb-5 leading-relaxed">
              You're doing well — finishing the remaining phases gives you richer feedback. Or exit now and pick up where you left off later.
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); goHome(); }}
                className="w-full py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              >
                Exit — resume later
              </button>
              <button
                onClick={() => { setShowEndConfirm(false); endInterview(); }}
                className="w-full py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                End &amp; get feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-base font-semibold mb-1">Exit interview?</div>
            <div className="text-sm text-gray-500 mb-5 leading-relaxed">
              Your progress, notepad, and conversation will be lost. This cannot be undone.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep going
              </button>
              <button
                onClick={goHome}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
