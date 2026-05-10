import { useInterviewStore } from "@/lib/store";

/**
 * Reusable upgrade prompt — shown when a feature is plan-gated.
 * variant: "modal" | "banner" | "inline"
 */
export default function UpgradePrompt({ title, description, cta, variant = "inline", onClose }) {
  const enterPricing = useInterviewStore((s) => s.enterPricing);

  if (variant === "modal") {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5" onClick={onClose}>
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-3xl mb-3 text-center">🔒</div>
          <div className="text-base font-semibold mb-1.5 text-center">{title || "Upgrade required"}</div>
          <div className="text-sm text-gray-500 mb-5 text-center leading-relaxed">
            {description}
          </div>
          <button
            onClick={() => { onClose?.(); enterPricing(); }}
            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 mb-2"
          >
            {cta || "View plans →"}
          </button>
          {onClose && (
            <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
              Maybe later
            </button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 rounded-xl text-sm">
        <span>🔒</span>
        <span className="flex-1 text-indigo-800 dark:text-indigo-300">{description}</span>
        <button
          onClick={enterPricing}
          className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex-shrink-0"
        >
          {cta || "Upgrade"}
        </button>
      </div>
    );
  }

  // inline (default)
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <div className="font-semibold mb-1">{title || "Upgrade required"}</div>
      <div className="text-sm text-gray-500 mb-4 leading-relaxed max-w-xs">{description}</div>
      <button
        onClick={enterPricing}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
      >
        {cta || "View plans →"}
      </button>
    </div>
  );
}
