import { useEffect, useRef, useState } from "react";
import { useInterviewStore } from "@/lib/store";

const TRACK_ICONS = {
  system_design:    "🏛️",
  behavioral:       "💬",
  problem_solving:  "🧩",
  low_level_design: "🧱",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function NotificationBell() {
  const notifications             = useInterviewStore((s) => s.feedbackNotifications);
  const dismiss                   = useInterviewStore((s) => s.dismissFeedbackNotification);
  const clearAll                  = useInterviewStore((s) => s.clearAllFeedbackNotifications);
  const viewSession               = useInterviewStore((s) => s.viewSession);

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = notifications.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const handleView = (n) => {
    viewSession(n.sessionId);
    dismiss(n.id);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title="Notifications"
      >
        {/* Bell SVG */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {/* Badge */}
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300">Notifications</span>
            {count > 0 && (
              <button
                onClick={() => { clearAll(); setOpen(false); }}
                className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Clear all
              </button>
            )}
          </div>

          {/* List */}
          {count === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-gray-400">
              No new notifications
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-base shrink-0 mt-0.5">
                    {TRACK_ICONS[n.track] || "📋"}
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-gray-700 dark:text-gray-300 leading-snug">
                      Feedback ready
                    </div>
                    <div className="text-[12px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {n.problemTitle}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => handleView(n)}
                      className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 whitespace-nowrap"
                    >
                      View →
                    </button>
                    <button
                      onClick={() => dismiss(n.id)}
                      className="text-[10px] text-gray-300 dark:text-gray-600 hover:text-gray-400"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
