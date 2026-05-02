import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import UserMenu from "@/components/UserMenu";

const SIDEBAR_TRACKS = [
  { id: "system_design",    icon: "🏛️", label: "System Design" },
  { id: "behavioral",       icon: "💬", label: "Behavioral" },
  { id: "problem_solving",  icon: "🧩", label: "Problem Solving" },
  { id: "low_level_design", icon: "🧱", label: "Low-Level Design" },
];

/**
 * DashboardShell — persistent sidebar + top bar wrapper shown on the
 * landing (Overview) and per-track home screens. Interview and scoring
 * screens are NOT wrapped in the shell (they're focus-mode).
 */
export default function DashboardShell({ children }) {
  const { screen, homeTrack, enterTrackHome, goLanding, enterHistory, enterInProgress, enterLearnHub, enterLearnReading, learnTrack } = useInterviewStore();
  const user = useAuthStore((s) => s.user);
  const openSignIn = useAuthStore((s) => s.openSignIn);

  const isOverview = screen === "landing";
  const activeTrack = screen === "home" ? homeTrack : null;

  const linkCls = (active) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
      active
        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium"
        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
    }`;

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col py-5 px-3 flex-shrink-0">
        <button
          onClick={goLanding}
          className="flex items-center gap-2 px-3 mb-8 text-left hover:opacity-90"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[11px]">
            IL
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">The</div>
            <div className="font-semibold tracking-tight text-sm -mt-0.5">Interview Loop</div>
          </div>
        </button>

        <div className="text-[11px] uppercase tracking-wider text-gray-400 px-3 mb-2">Tracks</div>
        <nav className="flex flex-col gap-0.5">
          <button onClick={goLanding} className={linkCls(isOverview)}>
            <span>🏠</span> Overview
          </button>
          {SIDEBAR_TRACKS.map((t) => (
            <button
              key={t.id}
              onClick={() => enterTrackHome(t.id)}
              className={linkCls(activeTrack === t.id)}
            >
              <span>{t.icon}</span>
              <span className="flex-1">{t.label}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                Live
              </span>
            </button>
          ))}
        </nav>

        {import.meta.env.VITE_ENABLE_LEARN_HUB === "true" && (
          <>
            <div className="text-[11px] uppercase tracking-wider text-gray-400 px-3 mt-6 mb-2">Learn</div>
            <nav className="flex flex-col gap-0.5">
              <button onClick={enterLearnHub} className={linkCls(screen === "learn_hub")}>
                <span>📚</span>
                <span className="flex-1">Learning Hub</span>
              </button>
              <button onClick={() => enterLearnReading("system_design")} className={linkCls(screen === "learn_reading" && learnTrack === "system_design")}>
                <span>🏛️</span>
                <span className="flex-1">System Design</span>
              </button>
              <button onClick={() => enterLearnReading("low_level_design")} className={linkCls(screen === "learn_reading" && learnTrack === "low_level_design")}>
                <span>🧱</span>
                <span className="flex-1">Low-Level Design</span>
              </button>
            </nav>
          </>
        )}

        <div className="text-[11px] uppercase tracking-wider text-gray-400 px-3 mt-6 mb-2">Account</div>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={enterHistory}
            className={linkCls(screen === "history")}
            disabled={!user}
            title={!user ? "Sign in to see your history" : undefined}
          >
            <span>📜</span>
            <span className="flex-1">History</span>
          </button>
          <button
            onClick={enterInProgress}
            className={linkCls(screen === "in_progress")}
            disabled={!user}
            title={!user ? "Sign in to see your in-progress sessions" : undefined}
          >
            <span>⏸</span>
            <span className="flex-1">In progress</span>
          </button>
          {import.meta.env.VITE_ENABLE_TOP_NAV_EXTRAS === "true" && (
            <button className={linkCls(false) + " cursor-not-allowed opacity-60"} disabled>
              <span>⚙️</span>
              <span className="flex-1">Settings</span>
              <span className="text-[10px] text-gray-400">soon</span>
            </button>
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-8 flex items-center justify-end gap-3 flex-shrink-0">
          {import.meta.env.VITE_ENABLE_TOP_NAV_EXTRAS === "true" && (
            <>
              <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-2 cursor-pointer">Plans</a>
              <a className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-2 cursor-pointer">Docs</a>
            </>
          )}
          {user ? (
            <>
              {import.meta.env.VITE_ENABLE_TOP_NAV_EXTRAS === "true" && (
                <button className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 text-sm" title="Notifications">🔔</button>
              )}
              <UserMenu />
            </>
          ) : (
            <div className="flex items-center pl-3 border-l border-gray-200 dark:border-gray-700">
              <button
                onClick={openSignIn}
                className="text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 px-3.5 py-1.5 rounded-lg"
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
