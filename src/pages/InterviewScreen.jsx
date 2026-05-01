import { useRef, useEffect, useState, useCallback } from "react";
import { useInterviewStore } from "@/lib/store";
import Canvas from "@/components/Canvas";
import ChatPanel from "@/components/ChatPanel";

const PHASE_CONFIG = {
  clarify: { label: "Clarify", color: "#6366F1", num: 1 },
  api_design: { label: "API Design", color: "#0EA5E9", num: 2 },
  design: { label: "Design", color: "#10B981", num: 3 },
  deep_dive: { label: "Deep dive", color: "#EF4444", num: 4 },
  scale: { label: "Scale", color: "#F59E0B", num: 5 },
};

/** Collapsible requirements overlay card, shown once clarify phase ends */
function RequirementsCard({ requirements }) {
  const [open, setOpen] = useState(false);
  const totalCount =
    (requirements.functional?.length || 0) + (requirements.nonfunctional?.length || 0);

  return (
    <div className="absolute bottom-4 left-3 z-10 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-500/30 rounded-xl shadow-lg w-64 text-[11px]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-500/5 rounded-xl transition-colors"
      >
        <span className="font-semibold text-amber-700 dark:text-amber-400">
          Requirements
        </span>
        <span className="text-amber-500/70">
          {open ? "▼" : "▶"} {totalCount} items
        </span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-amber-100 dark:border-amber-500/20 pt-2 max-h-60 overflow-y-auto">
          {requirements.functional?.length > 0 && (
            <div>
              <div className="font-semibold text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                Functional
              </div>
              <ul className="space-y-1">
                {requirements.functional.map((r, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300 leading-snug">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {requirements.nonfunctional?.length > 0 && (
            <div>
              <div className="font-semibold text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                Non-functional
              </div>
              <ul className="space-y-1">
                {requirements.nonfunctional.map((r, i) => (
                  <li key={i} className="text-blue-600 dark:text-blue-400 leading-snug">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {requirements.out_of_scope?.length > 0 && (
            <div>
              <div className="font-semibold text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                Out of scope
              </div>
              <ul className="space-y-1">
                {requirements.out_of_scope.map((r, i) => (
                  <li key={i} className="text-gray-400 dark:text-gray-500 line-through leading-snug">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InterviewScreen() {
  const {
    problem, phase, setPhase, timer, timerActive,
    canvasElements, setCanvasElements,
    endInterview, goHome, tickTimer, requirements, maxPhaseReached,
  } = useInterviewStore();

  const PHASE_ORDER = ["clarify", "api_design", "design", "deep_dive", "scale"];
  const maxIdx = PHASE_ORDER.indexOf(maxPhaseReached ?? "clarify");

  const canvasSnapshotFn = useRef(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [chatWidthPct, setChatWidthPct] = useState(30); // chat is left-side, default ~30%
  const isResizing = useRef(false);

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

  // Timer tick
  useEffect(() => {
    if (!timerActive) return;
    const id = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(id);
  }, [timerActive, tickTimer]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={() => setShowExitConfirm(true)}
          className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-[13px] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Exit
        </button>

        <div className="text-sm font-medium flex-1 truncate">
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
          onClick={endInterview}
          className="px-3.5 py-1.5 rounded-lg bg-red-500 text-white text-[13px] font-medium hover:bg-red-600 transition-colors"
        >
          End interview
        </button>
      </div>

      {/* Main split pane — chat on LEFT (~30%), canvas on RIGHT (remaining) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat (left) — dynamically sized */}
        <div
          style={{ width: `${chatWidthPct}%` }}
          className="flex flex-col flex-shrink-0 min-w-0 overflow-hidden"
        >
          <ChatPanel getCanvasDescription={() => canvasSnapshotFn.current?.()} />
        </div>

        {/* Draggable resize divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-1 flex-shrink-0 hover:w-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-blue-400 dark:hover:bg-blue-500 cursor-col-resize transition-[width,background-color] duration-100"
        />

        {/* Canvas (right) — takes remaining space */}
        <div className="flex-1 flex flex-col relative min-w-0">
          <Canvas
            onSnapshot={(fn) => (canvasSnapshotFn.current = fn)}
            elements={canvasElements}
            setElements={setCanvasElements}
            phase={phase}
          />

          {/* Requirements overlay — appears once clarify ends */}
          {requirements && phase !== "clarify" && (
            <RequirementsCard requirements={requirements} />
          )}
        </div>
      </div>

      {/* Exit confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="text-base font-semibold mb-1">Exit interview?</div>
            <div className="text-sm text-gray-500 mb-5 leading-relaxed">
              Your progress and canvas will be lost. This cannot be undone.
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
