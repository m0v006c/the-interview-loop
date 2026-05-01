import { useEffect, useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { TRACKS } from "@/data/tracks";
import * as db from "@/lib/db";
import SkillBreakdown from "@/components/SkillBreakdown";

function greetingName(user) {
  if (!user) return "";
  const meta = user.user_metadata || {};
  const first = (meta.full_name || meta.name || "").split(" ")[0];
  return first ? `, ${first}` : "";
}

const TRACK_META = {
  system_design:    { icon: "🏛️", iconBg: "bg-indigo-50 dark:bg-indigo-500/10",    meta: "5 phases · 45–60 min" },
  behavioral:       { icon: "💬", iconBg: "bg-pink-50 dark:bg-pink-500/10",        meta: "4 phases · voice-first · 30–45 min" },
  problem_solving:  { icon: "🧩", iconBg: "bg-sky-50 dark:bg-sky-500/10",          meta: "5 phases · 30–60 min" },
  low_level_design: { icon: "🧱", iconBg: "bg-emerald-50 dark:bg-emerald-500/10",  meta: "5 phases · 45–60 min" },
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function phaseLabel(trackId, phaseKey) {
  const cfg = TRACKS[trackId];
  return cfg?.phaseConfig?.[phaseKey]?.label || phaseKey;
}

function phaseIndex(trackId, phaseKey) {
  const cfg = TRACKS[trackId];
  if (!cfg) return 0;
  return cfg.phases.indexOf(phaseKey);
}

export default function LandingScreen() {
  const enterTrackHome = useInterviewStore((s) => s.enterTrackHome);
  const resumeSession = useInterviewStore((s) => s.resumeSession);
  const user = useAuthStore((s) => s.user);
  const openSignIn = useAuthStore((s) => s.openSignIn);

  const [inProgress, setInProgress] = useState([]);
  const [skillData, setSkillData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmEnd, setConfirmEnd] = useState(null); // session row pending end-confirmation

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [sessions, skills] = await Promise.all([
        db.listInProgressSessions(user.id),
        db.getSkillBreakdown(user.id),
      ]);
      if (cancelled) return;
      setInProgress(sessions);
      setSkillData(skills);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  const performEnd = async () => {
    if (!confirmEnd) return;
    const id = confirmEnd.id;
    setConfirmEnd(null);
    await db.patchSession(id, { status: "abandoned" });
    setInProgress((s) => s.filter((x) => x.id !== id));
  };

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-8">
        <div className="text-xs text-gray-500 mb-1">{today}</div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}{greetingName(user)}
        </h1>
        {!user && (
          <p className="text-sm text-gray-500 mt-1">
            Browse the tracks below. Sign in to save progress and unlock resume + skill breakdown.
          </p>
        )}
      </div>

      {/* In progress */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold tracking-tight flex items-center gap-2">
            In progress
            {inProgress.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-500/10 dark:text-indigo-400">
                {inProgress.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-gray-400">Most recent per track</span>
        </div>

        {!user ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-500">
            <button onClick={openSignIn} className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Sign in</button>{" "}
            to track your sessions and resume where you left off.
          </div>
        ) : loading ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-400">
            Loading sessions...
          </div>
        ) : inProgress.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-500">
            No sessions in progress. Pick a track below to start.
          </div>
        ) : (
          <div className="space-y-2">
            {inProgress.map((s) => {
              const tMeta = TRACK_META[s.track];
              const cfg = TRACKS[s.track];
              const phases = cfg?.phases || [];
              const currentIdx = phaseIndex(s.track, s.phase);
              return (
                <div key={s.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                  <div className={`w-10 h-10 rounded-lg grid place-items-center text-lg flex-shrink-0 ${tMeta?.iconBg}`}>
                    {tMeta?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{s.problem_title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium flex-shrink-0">
                        {cfg?.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3">
                      <span>{phaseLabel(s.track, s.phase)} phase · {currentIdx + 1} of {phases.length}</span>
                      <span className="text-gray-300">·</span>
                      <span>{timeAgo(s.updated_at)}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {phases.map((p, i) => (
                        <div
                          key={p}
                          className={`h-1 flex-1 rounded-full ${
                            i < currentIdx ? "bg-indigo-500"
                            : i === currentIdx ? "bg-indigo-300"
                            : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setConfirmEnd(s)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      End
                    </button>
                    <button
                      onClick={() => resumeSession(s.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                    >
                      Resume →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tracks list */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold tracking-tight">Tracks</h2>
          <span className="text-xs text-gray-400">Four rounds, each with its own AI interviewer</span>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {Object.entries(TRACKS).map(([id, cfg]) => {
            const m = TRACK_META[id];
            if (!m) return null;
            const trackStats = skillData?.[id];
            return (
              <div key={id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className={`w-11 h-11 rounded-xl grid place-items-center text-lg flex-shrink-0 ${m.iconBg}`}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cfg.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium dark:bg-emerald-500/10 dark:text-emerald-400">Live</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {cfg.problems.length} problems · {m.meta}
                    {trackStats && (
                      <> · <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {trackStats.sessionCount} completed · avg {trackStats.avgScore.toFixed(1)}/5
                      </span></>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => enterTrackHome(id)}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 flex-shrink-0"
                >
                  Practice →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill breakdown */}
      <SkillBreakdown skillData={skillData} loading={loading} />

      {/* End-session confirmation */}
      {confirmEnd && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
          onClick={() => setConfirmEnd(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-base font-semibold mb-1.5">End this session?</div>
            <div className="text-sm text-gray-500 mb-5 leading-relaxed">
              <span className="text-gray-800 dark:text-gray-200 font-medium">{confirmEnd.problem_title}</span>{" "}
              will be removed from your in-progress list. Your transcript is preserved
              in history, but you won't be able to resume this session.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmEnd(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={performEnd}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                End session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
