import { useEffect, useMemo, useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { TRACKS } from "@/data/tracks";
import * as db from "@/lib/db";

const TRACK_META = {
  system_design:    { icon: "🏛️", iconBg: "bg-indigo-50 dark:bg-indigo-500/10", chip: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400" },
  behavioral:       { icon: "💬", iconBg: "bg-pink-50 dark:bg-pink-500/10",       chip: "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-500/10 dark:border-pink-500/30 dark:text-pink-400" },
  problem_solving:  { icon: "🧩", iconBg: "bg-sky-50 dark:bg-sky-500/10",         chip: "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400" },
  low_level_design: { icon: "🧱", iconBg: "bg-emerald-50 dark:bg-emerald-500/10", chip: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400" },
};

const DIFFICULTY_CHIP = {
  Easy:   "bg-green-50 text-green-600 dark:bg-green-500/10",
  Medium: "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  Hard:   "bg-red-50   text-red-600   dark:bg-red-500/10",
};

function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  const w = Math.floor(d / 7);
  return w === 1 ? "1 week ago" : `${w} weeks ago`;
}

function formatDuration(s) {
  if (!s) return "0 min";
  const m = Math.floor(s / 60);
  return `${m} min`;
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

export default function InProgressScreen() {
  const user = useAuthStore((s) => s.user);
  const { resumeSession, retrySession, endInProgressSession, enterTrackHome } = useInterviewStore();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState("all");
  const [confirmEnd, setConfirmEnd] = useState(null); // session row pending end-confirmation

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await db.listInProgressSessions(user.id);
      if (cancelled) return;
      setSessions(rows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const trackCounts = useMemo(() => {
    const counts = { all: sessions.length };
    for (const s of sessions) counts[s.track] = (counts[s.track] || 0) + 1;
    return counts;
  }, [sessions]);

  const filtered = useMemo(() => {
    if (trackFilter === "all") return sessions;
    return sessions.filter((s) => s.track === trackFilter);
  }, [sessions, trackFilter]);

  const performEnd = async () => {
    if (!confirmEnd) return;
    const id = confirmEnd.id;
    setConfirmEnd(null);
    await endInProgressSession(id);
    setSessions((s) => s.filter((x) => x.id !== id));
  };

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">In progress</h1>
        <p className="text-sm text-gray-500 mt-1">
          {sessions.length} active session{sessions.length === 1 ? "" : "s"}
          <span className="ml-2 text-gray-400">· Resume where you left off, retry with a fresh start, or end a session you're done with.</span>
        </p>
      </div>

      {!user ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
          <div className="text-4xl mb-2">⏸</div>
          <div className="text-sm font-medium">Sign in to see your in-progress sessions</div>
        </div>
      ) : (
        <>
          {/* Track filter */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Track</div>
            <div className="flex items-center gap-2 flex-wrap">
              <TrackPill active={trackFilter === "all"} onClick={() => setTrackFilter("all")}>
                All ({trackCounts.all || 0})
              </TrackPill>
              {Object.entries(TRACKS).map(([id, cfg]) => (
                <TrackPill
                  key={id}
                  active={trackFilter === id}
                  onClick={() => setTrackFilter(id)}
                  disabled={!trackCounts[id]}
                >
                  {TRACK_META[id]?.icon} {cfg.label} ({trackCounts[id] || 0})
                </TrackPill>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center text-sm text-gray-400">
              Loading your in-progress sessions...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-sm font-medium">
                {sessions.length === 0 ? "No sessions in progress" : "No in-progress sessions for this track"}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {sessions.length === 0 ? (
                  <>Pick a track from the sidebar to start a session.</>
                ) : (
                  <>
                    Try another track above — or{" "}
                    <button
                      onClick={() => enterTrackHome(trackFilter)}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      start a new {TRACKS[trackFilter]?.label} session →
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => (
                <InProgressRow
                  key={s.id}
                  session={s}
                  onResume={() => resumeSession(s.id)}
                  onRetry={() => retrySession(s)}
                  onEnd={() => setConfirmEnd(s)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* End confirmation */}
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
              will be moved to your history as <span className="font-medium">abandoned</span>. The transcript is preserved so you can review it, but you won't be able to resume.
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

// ─── Sub-components ────────────────────────────────────────────────

function TrackPill({ active, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
        active
          ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
          : disabled
          ? "border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
          : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function InProgressRow({ session, onResume, onRetry, onEnd }) {
  const meta = TRACK_META[session.track] || {};
  const cfg = TRACKS[session.track];
  const phases = cfg?.phases || [];
  const currentIdx = phaseIndex(session.track, session.phase);

  const handleRowClick = (e) => {
    if (e.target.closest("button")) return;
    onResume();
  };

  return (
    <div
      role="button"
      onClick={handleRowClick}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex items-center gap-4 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors cursor-pointer"
    >
      <div className={`w-11 h-11 rounded-xl grid place-items-center text-lg flex-shrink-0 ${meta.iconBg}`}>
        {meta.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">{session.problem_title}</span>
          {cfg && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${meta.chip}`}>
              {cfg.label}
            </span>
          )}
          {session.problem_meta?.difficulty && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${DIFFICULTY_CHIP[session.problem_meta.difficulty] || ""}`}>
              {session.problem_meta.difficulty}
            </span>
          )}
          {session.problem_meta?.company && (
            <span className="text-[10px] text-gray-400">· {session.problem_meta.company}</span>
          )}
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            In progress
          </span>
        </div>

        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
          <span>
            {phaseLabel(session.track, session.phase)} phase · {currentIdx + 1} of {phases.length}
          </span>
          <span className="text-gray-300">·</span>
          <span>{formatDuration(session.duration_seconds)} · {(session.transcript?.length) || 0} messages</span>
          <span className="text-gray-300">·</span>
          <span>Last active {timeAgo(session.updated_at)}</span>
        </div>

        {/* Phase progress bar */}
        <div className="flex gap-1 mt-2">
          {phases.map((p, i) => (
            <div
              key={p}
              className={`h-1 flex-1 rounded-full ${
                i < currentIdx
                  ? "bg-indigo-500"
                  : i === currentIdx
                  ? "bg-indigo-300"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEnd(); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          End
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 dark:hover:bg-gray-800 transition-colors"
          title="Abandon and start the same problem fresh"
        >
          ↻ Retry
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onResume(); }}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
        >
          Resume →
        </button>
      </div>
    </div>
  );
}
