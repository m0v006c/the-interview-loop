import { useEffect, useMemo, useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { TRACKS } from "@/data/tracks";
import { getTimeStatus } from "@/lib/scoringConfig";
import * as db from "@/lib/db";

const VERDICT_COLORS = {
  STRONG_HIRE: "#059669",
  HIRE: "#10B981",
  LEAN_HIRE: "#F59E0B",
  LEAN_NO_HIRE: "#F97316",
  NO_HIRE: "#EF4444",
};

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

const TIME_CHIP_STYLE = {
  "on-time":   "text-emerald-600",
  "borderline":"text-amber-600",
  "over":      "text-orange-600",
  "way-over":  "text-red-600",
};
const TIME_CHIP_LABEL = {
  "on-time":   "On time",
  "borderline":"Borderline",
  "over":      "Over budget",
  "way-over":  "Way over",
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
  if (w === 1) return "1 week ago";
  if (w < 4) return `${w} weeks ago`;
  const mo = Math.floor(d / 30);
  return mo === 1 ? "1 month ago" : `${mo} months ago`;
}

function formatDuration(s) {
  if (!s) return "0 min";
  const m = Math.floor(s / 60);
  return `${m} min`;
}

function computeAvg(scores) {
  if (!scores?.scores) return null;
  const values = Object.values(scores.scores).map((d) => d?.score).filter((n) => typeof n === "number");
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Sort comparators
const SORTS = {
  newest:       (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  oldest:       (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
  "score-desc": (a, b) => (computeAvg(b.scores) || 0) - (computeAvg(a.scores) || 0),
  "score-asc":  (a, b) => (computeAvg(a.scores) || -1) - (computeAvg(b.scores) || -1),
};

export default function HistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const { viewSession, retrySession } = useInterviewStore();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const [status, setStatus] = useState("all"); // "all" | "completed" | "abandoned"
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await db.listHistorySessions(user.id, { limit: 200 });
      if (cancelled) return;
      setSessions(rows);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Counts per track (before filtering)
  const trackCounts = useMemo(() => {
    const counts = { all: sessions.length };
    for (const s of sessions) counts[s.track] = (counts[s.track] || 0) + 1;
    return counts;
  }, [sessions]);

  // Apply filters + sort
  const filtered = useMemo(() => {
    let list = sessions;
    if (track !== "all") list = list.filter((s) => s.track === track);
    if (difficulty !== "all") list = list.filter((s) => s.problem_meta?.difficulty === difficulty);
    if (verdict !== "all") list = list.filter((s) => s.scores?.overall_verdict === verdict);
    if (status !== "all") list = list.filter((s) => s.status === status);
    return [...list].sort(SORTS[sort] || SORTS.newest);
  }, [sessions, track, difficulty, verdict, status, sort]);

  // Aggregate stats for header
  const { completedCount, abandonedCount, avgScore } = useMemo(() => {
    let c = 0, a = 0, sum = 0, scored = 0;
    for (const s of sessions) {
      if (s.status === "completed") c += 1;
      if (s.status === "abandoned") a += 1;
      const avg = computeAvg(s.scores);
      if (avg != null) { sum += avg; scored += 1; }
    }
    return { completedCount: c, abandonedCount: a, avgScore: scored ? sum / scored : 0 };
  }, [sessions]);

  return (
    <div className="px-8 py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Interview history</h1>
        <p className="text-sm text-gray-500 mt-1">
          {completedCount} completed · {abandonedCount} abandoned
          {avgScore > 0 && <> · average <span className="text-gray-700 dark:text-gray-300 font-medium">{avgScore.toFixed(1)}/5.0</span></>}
        </p>
      </div>

      {!user ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
          <div className="text-4xl mb-2">📜</div>
          <div className="text-sm font-medium">Sign in to see your interview history</div>
        </div>
      ) : (
        <>
          {/* Filter strip */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3 mb-4">
            {/* Track tabs */}
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Track</div>
              <div className="flex items-center gap-2 flex-wrap">
                <TrackPill active={track === "all"} onClick={() => setTrack("all")}>
                  All ({trackCounts.all || 0})
                </TrackPill>
                {Object.entries(TRACKS).map(([id, cfg]) => (
                  <TrackPill
                    key={id}
                    active={track === id}
                    onClick={() => setTrack(id)}
                  >
                    {TRACK_META[id]?.icon} {cfg.label} ({trackCounts[id] || 0})
                  </TrackPill>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-6 flex-wrap">
              <Segmented
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { key: "all",    label: "Any" },
                  { key: "Easy",   label: "Easy" },
                  { key: "Medium", label: "Medium" },
                  { key: "Hard",   label: "Hard" },
                ]}
              />

              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Verdict</div>
                <select
                  value={verdict}
                  onChange={(e) => setVerdict(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="all">All verdicts</option>
                  <option value="STRONG_HIRE">Strong Hire</option>
                  <option value="HIRE">Hire</option>
                  <option value="LEAN_HIRE">Lean Hire</option>
                  <option value="LEAN_NO_HIRE">Lean No Hire</option>
                  <option value="NO_HIRE">No Hire</option>
                </select>
              </div>

              <Segmented
                label="Status"
                value={status}
                onChange={setStatus}
                options={[
                  { key: "all",        label: "All" },
                  { key: "completed",  label: "Completed" },
                  { key: "abandoned",  label: "Abandoned" },
                ]}
              />

              <div className="ml-auto">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">Sort by</div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="score-desc">Highest score</option>
                  <option value="score-asc">Lowest score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session list */}
          {loading ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center text-sm text-gray-400">
              Loading your history...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
              <div className="text-4xl mb-2">📭</div>
              <div className="text-sm font-medium">
                {sessions.length === 0 ? "No completed sessions yet" : "No sessions match your filters"}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {sessions.length === 0
                  ? "Pick a track and finish a session to start building your history."
                  : "Try clearing a filter."}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
              {filtered.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onView={() => viewSession(s.id)}
                  onRetry={() => retrySession(s)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Small sub-components ──────────────────────────────────────────

function TrackPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
        active
          ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
          : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Segmented({ label, value, onChange, options }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">{label}</div>
      <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        {options.map((o, i) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`px-3 py-1.5 text-[12px] font-medium transition-colors ${
              value === o.key
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            } ${i > 0 ? "border-l border-gray-200 dark:border-gray-700" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SessionRow({ session, onView, onRetry }) {
  const meta = TRACK_META[session.track] || {};
  const cfg = TRACKS[session.track];
  const avg = computeAvg(session.scores);
  const verdict = session.scores?.overall_verdict;
  const verdictColor = verdict ? VERDICT_COLORS[verdict] : null;
  const isAbandoned = session.status === "abandoned";
  const timeInfo = getTimeStatus(session.track, session.duration_seconds || 0);

  const handleRowClick = (e) => {
    // Don't navigate if a button was clicked
    if (e.target.closest("button")) return;
    onView();
  };

  return (
    <div
      role="button"
      onClick={handleRowClick}
      className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${
        isAbandoned ? "opacity-75" : ""
      }`}
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
          {isAbandoned && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
              Abandoned
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
          <span>{formatDuration(session.duration_seconds)} · {(session.transcript?.length) || 0} messages</span>
          {!isAbandoned && session.duration_seconds ? (
            <span className={TIME_CHIP_STYLE[timeInfo.status]}>
              {TIME_CHIP_LABEL[timeInfo.status]}
              {timeInfo.factor < 1 && ` · score × ${timeInfo.factor.toFixed(2)}`}
            </span>
          ) : null}
          <span className="text-gray-300">·</span>
          <span>{timeAgo(session.updated_at)}</span>
          {isAbandoned && <span className="italic text-gray-400">· no scores</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {avg != null ? (
          <div className="text-right">
            <div className="text-xl font-semibold leading-none">
              {avg.toFixed(1)} <span className="text-gray-400 text-xs">/5</span>
            </div>
            {verdict && verdictColor && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold mt-1 inline-block"
                style={{ background: verdictColor }}
              >
                {verdict.replace(/_/g, " ")}
              </span>
            )}
          </div>
        ) : (
          <div className="text-right">
            <div className="text-xl font-semibold leading-none text-gray-300 dark:text-gray-600">
              — <span className="text-gray-300 dark:text-gray-600 text-xs">/5</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block bg-gray-100 dark:bg-gray-800 text-gray-500">
              UNSCORED
            </span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:border-indigo-300 hover:text-indigo-600 dark:hover:bg-gray-800 transition-colors"
        >
          ↻ Retry
        </button>
        <span className="text-gray-300 text-lg">›</span>
      </div>
    </div>
  );
}
