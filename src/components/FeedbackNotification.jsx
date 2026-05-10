import { useEffect, useState } from "react";
import { useInterviewStore } from "@/lib/store";

const TRACK_ICONS = {
  system_design:    "🏛️",
  behavioral:       "💬",
  problem_solving:  "🧩",
  low_level_design: "🧱",
};

export default function FeedbackNotification() {
  const notification       = useInterviewStore((s) => s.feedbackNotification);
  const clearNotification  = useInterviewStore((s) => s.clearFeedbackNotification);
  const viewSession        = useInterviewStore((s) => s.viewSession);
  const [visible, setVisible] = useState(false);

  // Animate in when notification appears
  useEffect(() => {
    if (notification) {
      // Small delay so CSS transition fires
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  const handleView = () => {
    viewSession(notification.sessionId);
    clearNotification();
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(clearNotification, 250); // wait for slide-out
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-500/40 rounded-2xl shadow-xl px-4 py-3.5 max-w-[320px] transition-all duration-250 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* Pulsing indicator */}
      <div className="relative shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
        <div className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-60" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 leading-snug">
          Feedback ready {TRACK_ICONS[notification.track] || ""}
        </div>
        <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {notification.problemTitle}
        </div>
      </div>

      {/* View button */}
      <button
        onClick={handleView}
        className="shrink-0 text-[12px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        View →
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
