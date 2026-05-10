import { useEffect, useState, useMemo } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { usePlan } from "@/lib/usePlan";
import UpgradePrompt from "@/components/UpgradePrompt";
import * as db from "@/lib/db";
import { TRACKS } from "@/data/tracks";
import { DIMENSIONS_BY_TRACK } from "@/components/ScoreCard";
import { getResourcesForDimension } from "@/lib/analyticsResources";

const TRACK_ORDER = ["system_design", "behavioral", "problem_solving", "low_level_design"];
const TRACK_COLOR = {
  system_design:    "#6366F1",
  behavioral:       "#EC4899",
  problem_solving:  "#0EA5E9",
  low_level_design: "#10B981",
};

// ── Sub-components ────────────────────────────────────────────────

function Sparkline({ data, color = "#6366F1", height = 52 }) {
  if (!data || data.length < 2) return (
    <div className="flex items-center text-[11px] text-gray-400" style={{ height }}>
      Complete 2+ sessions to see trend
    </div>
  );
  const w = 300, h = height, pad = 6;
  const vw = w + pad * 2, vh = h + pad * 2;
  const uid = `g${color.replace("#", "")}${data.length}`;
  const pt = (v, i) => ({
    x: pad + (i / (data.length - 1)) * w,
    y: pad + h - (v / 5) * h,
  });
  const linePts = data.map((v, i) => { const p = pt(v, i); return `${p.x},${p.y}`; }).join(" ");
  const f = pt(data[0], 0), l = pt(data[data.length - 1], data.length - 1);
  const areaPts = `${linePts} ${l.x},${vh - pad} ${f.x},${vh - pad}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${uid})`} />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => {
        const { x, y } = pt(v, i);
        return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2.5} fill={color} />;
      })}
    </svg>
  );
}

function ScoreBar({ score }) {
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${(score / 5) * 100}%`, background: color }} />
    </div>
  );
}

function WeeklyHeatmap({ sessions }) {
  const today = new Date();
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (83 - i));
    return d.toISOString().split("T")[0];
  });
  const countByDay = {};
  (sessions || []).forEach((s) => {
    const day = s.completed_at?.split("T")[0];
    if (day) countByDay[day] = (countByDay[day] || 0) + 1;
  });
  return (
    <div>
      <div className="grid grid-cols-[repeat(84,1fr)] gap-0.5">
        {days.map((day) => {
          const count = countByDay[day] || 0;
          const bg = count === 0 ? "bg-gray-100 dark:bg-gray-800"
            : count === 1 ? "bg-indigo-200 dark:bg-indigo-500/40"
            : count === 2 ? "bg-indigo-400 dark:bg-indigo-500/70"
            : "bg-indigo-600 dark:bg-indigo-500";
          return <div key={day} className={`h-2.5 rounded-sm ${bg}`} title={`${day}: ${count} session${count !== 1 ? "s" : ""}`} />;
        })}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-gray-400">
        <span>Less</span>
        {["bg-gray-100 dark:bg-gray-800","bg-indigo-200 dark:bg-indigo-500/40","bg-indigo-400 dark:bg-indigo-500/70","bg-indigo-600 dark:bg-indigo-500"].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// Resource link chip — opens in new tab
function ResourceLink({ title, url, description }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-colors group"
    >
      <span className="text-[13px] shrink-0 mt-0.5">📖</span>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline leading-snug">
          {title} ↗
        </div>
        {description && (
          <div className="text-[11px] text-gray-400 mt-0.5 leading-snug line-clamp-2">{description}</div>
        )}
      </div>
    </a>
  );
}

// A single gap card inside the AI report
function GapCard({ gap, dimLabel }) {
  const resources = getResourcesForDimension(gap.dimension_key);
  const scoreColor = (gap.avg_score ?? 0) < 2.5 ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>
          {gap.avg_score != null ? `${gap.avg_score.toFixed(1)}/5` : "Gap"}
        </span>
        <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{dimLabel}</span>
      </div>
      <div className="p-4 space-y-4">
        {/* Diagnosis */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Diagnosis</div>
          <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{gap.diagnosis}</p>
        </div>
        {/* Action steps */}
        {gap.action_steps?.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Action steps</div>
            <ol className="space-y-1.5">
              {gap.action_steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-gray-700 dark:text-gray-300 leading-snug">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
        {/* Reading resources */}
        {resources.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Reading material</div>
            <div className="space-y-1.5">
              {resources.map((r) => (
                <ResourceLink key={r.url} {...r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const user = useAuthStore((s) => s.user);
  const { can } = usePlan();
  const isAdvanced = can("advanced_analytics");
  const enterTrackHome = useInterviewStore((s) => s.enterTrackHome);

  const [allSessions, setAllSessions]     = useState([]);
  const [trends, setTrends]               = useState({});
  const [loading, setLoading]             = useState(true);
  const [aiReport, setAiReport]                   = useState(null);
  const [reportWeekKey, setReportWeekKey]         = useState(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState(null);
  const [reportSessionsAnalyzed, setReportSessionsAnalyzed] = useState(0);
  const [generating, setGenerating]               = useState(false);
  const [genError, setGenError]                   = useState(null);

  // Load sessions + cached report
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [sessions, savedReport] = await Promise.all([
        db.listCompletedSessions(user.id, { limit: 200 }),
        db.getLatestAnalyticsReport(user.id),
      ]);
      if (cancelled) return;
      setAllSessions(sessions);

      if (savedReport) {
        setAiReport(savedReport.report);
        setReportWeekKey(savedReport.week_key);
        setReportGeneratedAt(savedReport.generated_at);
        setReportSessionsAnalyzed(savedReport.sessions_analyzed || 0);
      }

      // Per-session trends — last 10 per track
      const trackTrends = {};
      for (const track of TRACK_ORDER) {
        const ts = sessions.filter((s) => s.track === track && s.scores?.scores).slice(-10);
        if (ts.length < 2) continue;
        trackTrends[track] = ts.map((s) => {
          const vals = Object.values(s.scores.scores).map((v) => v?.score).filter(Number.isFinite);
          return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
        });
      }
      setTrends(trackTrends);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Readiness: avg of latest-3-session scores per track, normalised to %
  const readiness = useMemo(() => {
    if (!allSessions.length) return null;
    const scores = TRACK_ORDER.map((track) => {
      const ts = allSessions.filter((s) => s.track === track && s.scores?.scores);
      if (!ts.length) return null;
      const latest3 = ts.slice(-3);
      const avg = latest3.reduce((sum, s) => {
        const vals = Object.values(s.scores.scores).map((v) => v?.score).filter(Number.isFinite);
        return sum + (vals.reduce((a, b) => a + b, 0) / (vals.length || 1));
      }, 0) / latest3.length;
      return avg;
    }).filter(Boolean);
    if (!scores.length) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) / 5 * 100);
  }, [allSessions]);

  const tracksWithSessions = useMemo(
    () => TRACK_ORDER.filter((t) => allSessions.some((s) => s.track === t && s.scores?.scores)).length,
    [allSessions]
  );

  // Per-dimension averages per track (simple average, for display only)
  const trackAnalysis = useMemo(() => {
    const result = {};
    for (const track of TRACK_ORDER) {
      const ts = allSessions.filter((s) => s.track === track && s.scores?.scores);
      if (!ts.length) continue;
      const dims = DIMENSIONS_BY_TRACK[track] || [];
      result[track] = dims.map((d) => {
        const vals = ts.map((s) => s.scores.scores[d.key]?.score).filter(Number.isFinite);
        if (!vals.length) return null;
        return { key: d.key, label: d.label, avg: vals.reduce((a, b) => a + b, 0) / vals.length };
      }).filter(Boolean).sort((a, b) => a.avg - b.avg);
    }
    return result;
  }, [allSessions]);

  // Generate AI report
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      // Build compact payload
      const dimensionAverages = {};
      const sessionCounts = {};
      const trendDirections = {};
      for (const track of TRACK_ORDER) {
        const dims = trackAnalysis[track];
        if (!dims?.length) continue;
        dimensionAverages[track] = {};
        for (const d of dims) {
          dimensionAverages[track][d.key] = { avg: d.avg, label: d.label };
        }
        sessionCounts[track] = allSessions.filter((s) => s.track === track && s.scores?.scores).length;
        const tData = trends[track];
        if (tData?.length >= 2) {
          const delta = tData[tData.length - 1] - tData[0];
          trendDirections[track] = delta > 0.3 ? "improving" : delta < -0.3 ? "declining" : "stable";
        } else {
          trendDirections[track] = "insufficient_data";
        }
      }

      // Include last 10 sessions' feedback text
      const recentFeedback = allSessions.slice(0, 10).map((s) => ({
        track: s.track,
        date: s.completed_at?.split("T")[0],
        summary: s.scores?.summary,
        top_improvement: s.scores?.top_improvement,
        top_strength: s.scores?.top_strength,
      })).filter((f) => f.summary || f.top_improvement);

      const resp = await fetch("/api/analytics-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dimensionAverages, recentFeedback, trendDirections, sessionCounts }),
      });
      const ct = resp.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        throw new Error(`Server returned ${resp.status} (non-JSON) — restart the dev server and try again`);
      }
      const json = await resp.json();
      if (!resp.ok || !json.report) throw new Error(json.error || "Generation failed");

      // Attach avg_score to each gap for display
      const report = json.report;
      for (const [track, trackData] of Object.entries(report.tracks || {})) {
        for (const gap of trackData.gaps || []) {
          const dim = trackAnalysis[track]?.find((d) => d.key === gap.dimension_key);
          if (dim) gap.avg_score = dim.avg;
        }
      }

      const weekKey = db.currentWeekKey();
      const saved = await db.saveAnalyticsReport(user.id, weekKey, report, allSessions.length);
      setAiReport(report);
      setReportWeekKey(weekKey);
      setReportGeneratedAt(saved?.generated_at || new Date().toISOString());
      setReportSessionsAnalyzed(allSessions.length);
    } catch (err) {
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const currentWeek = db.currentWeekKey();
  const reportIsCurrent = reportWeekKey === currentWeek;

  // Allow regeneration if 3+ days elapsed OR 3+ new sessions since last run
  const REGEN_MIN_DAYS = 3;
  const REGEN_MIN_NEW_SESSIONS = 3;
  const regenEligibility = useMemo(() => {
    if (!aiReport || !reportGeneratedAt) return { allowed: true }; // first generation always allowed
    const daysSince = (Date.now() - new Date(reportGeneratedAt)) / (1000 * 60 * 60 * 24);
    const newSessions = allSessions.length - reportSessionsAnalyzed;
    if (daysSince >= REGEN_MIN_DAYS) return { allowed: true, reason: "time" };
    if (newSessions >= REGEN_MIN_NEW_SESSIONS) return { allowed: true, reason: "sessions" };
    const daysLeft = Math.ceil(REGEN_MIN_DAYS - daysSince);
    const sessionsNeeded = REGEN_MIN_NEW_SESSIONS - newSessions;
    return {
      allowed: false,
      daysLeft,
      sessionsNeeded,
      newSessions,
      hint: newSessions > 0
        ? `${sessionsNeeded} more session${sessionsNeeded !== 1 ? "s" : ""} needed, or available in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`
        : `Available in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} or after ${sessionsNeeded} new session${sessionsNeeded !== 1 ? "s" : ""}`,
    };
  }, [aiReport, reportGeneratedAt, reportSessionsAnalyzed, allSessions.length]);

  if (!isAdvanced) {
    return (
      <div className="px-8 py-8 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Advanced Analytics</h1>
        <p className="text-sm text-gray-500 mb-8">AI-powered weekly improvement plans, skill trends, practice patterns.</p>
        <UpgradePrompt
          variant="inline"
          title="Advanced Analytics — Pro feature"
          description="Get a personalized AI improvement plan every week with knowledge gap analysis, actionable steps, and curated reading resources. Available on the Pro plan."
          cta="Upgrade to Pro →"
        />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Advanced Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Based on your last {allSessions.length} completed sessions</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading analytics...</div>
      ) : allSessions.length < 3 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center text-sm text-gray-500">
          Complete at least 3 interviews to unlock analytics insights.
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Top stats ── */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{readiness ?? "—"}%</div>
              <div className="text-xs text-gray-500 mt-1">Interview readiness</div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${readiness || 0}%` }} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
              <div className="text-3xl font-bold">{allSessions.length}</div>
              <div className="text-xs text-gray-500 mt-1">Total sessions</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center">
              <div className="text-3xl font-bold">{tracksWithSessions}<span className="text-lg text-gray-400">/4</span></div>
              <div className="text-xs text-gray-500 mt-1">Tracks practiced</div>
              <div className="text-[11px] text-gray-400 mt-2">
                {tracksWithSessions < 4 ? `Try ${4 - tracksWithSessions} more track${4 - tracksWithSessions !== 1 ? "s" : ""}` : "All tracks explored ✓"}
              </div>
            </div>
          </div>

          {/* ── Skill trends ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-semibold">Skill trend by track</h2>
              <span className="text-[11px] text-gray-400">Last 10 sessions per track</span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              {TRACK_ORDER.map((track) => {
                const data = trends[track];
                const color = TRACK_COLOR[track];
                const lastScore = data?.[data.length - 1];
                const sessionCount = allSessions.filter((s) => s.track === track && s.scores?.scores).length;
                return (
                  <div key={track}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{TRACKS[track]?.label}</span>
                      <div className="flex items-center gap-2">
                        {sessionCount > 0 && <span className="text-[10px] text-gray-400">{sessionCount} session{sessionCount !== 1 ? "s" : ""}</span>}
                        {lastScore != null && <span className="text-xs font-mono font-bold" style={{ color }}>{lastScore.toFixed(1)}/5</span>}
                      </div>
                    </div>
                    <Sparkline data={data} color={color} height={52} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── AI Weekly Analysis ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="font-semibold">Weekly AI Analysis</h2>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {aiReport && reportGeneratedAt ? (() => {
                    const d = new Date(reportGeneratedAt);
                    const dateStr = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
                    return reportIsCurrent
                      ? `Auto-loaded · generated ${dateStr} · updates each week`
                      : `Showing last week's report (${dateStr}) · regenerate for fresh insights`;
                  })() : "Generated once per week · auto-loads on return visits"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={handleGenerate}
                  disabled={generating || (aiReport && !regenEligibility.allowed)}
                  title={!regenEligibility.allowed ? regenEligibility.hint : undefined}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    aiReport && !regenEligibility.allowed
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 disabled:cursor-wait"
                  }`}
                >
                  {generating ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Analyzing…
                    </>
                  ) : aiReport ? "Regenerate" : "Generate analysis"}
                </button>
                {aiReport && !regenEligibility.allowed && (
                  <span className="text-[10px] text-gray-400 text-right max-w-[200px]">
                    {regenEligibility.hint}
                  </span>
                )}
                {aiReport && regenEligibility.allowed && regenEligibility.newSessions > 0 && (
                  <span className="text-[10px] text-indigo-400">
                    {regenEligibility.newSessions} new session{regenEligibility.newSessions !== 1 ? "s" : ""} since last run
                  </span>
                )}
              </div>
            </div>

            {genError && (
              <div className="px-5 py-3 bg-red-50 dark:bg-red-500/10 border-b border-red-100 dark:border-red-500/20 text-[13px] text-red-600 dark:text-red-400">
                {genError} — please try again.
              </div>
            )}

            {!aiReport && !generating && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                Click <span className="font-medium text-gray-600 dark:text-gray-300">"Generate analysis"</span> to get your personalized weekly plan — knowledge gaps, specific action steps, and reading resources curated for your weak areas.
              </div>
            )}

            {generating && !aiReport && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                Analyzing your {allSessions.length} sessions across {tracksWithSessions} tracks…
              </div>
            )}

            {aiReport && (
              <div className="p-5 space-y-6">
                {/* Overall summary */}
                <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-2">Overall Assessment</div>
                  <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{aiReport.overall_summary}</p>
                </div>

                {/* This week's focus */}
                {aiReport.this_week_focus && (
                  <div className="flex gap-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl p-4 border border-amber-100 dark:border-amber-500/20">
                    <span className="text-lg shrink-0">🎯</span>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">This week's focus</div>
                      <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">{aiReport.this_week_focus}</p>
                    </div>
                  </div>
                )}

                {/* Per-track gap analysis */}
                {Object.entries(aiReport.tracks || {}).map(([track, trackData]) => {
                  const color = TRACK_COLOR[track];
                  const trackLabel = TRACKS[track]?.label || track;
                  const allDims = Object.values(DIMENSIONS_BY_TRACK).flat();
                  const gaps = trackData.gaps || [];
                  const strengthKeys = trackData.strength_keys || [];
                  if (!gaps.length && !strengthKeys.length) return null;
                  return (
                    <div key={track}>
                      {/* Track header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <h3 className="font-semibold text-[15px]">{trackLabel}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {trackData.trend && trackData.trend !== "insufficient_data" && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              trackData.trend === "improving"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                                : trackData.trend === "declining"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}>
                              {trackData.trend === "improving" ? "↑ Improving" : trackData.trend === "declining" ? "↓ Declining" : "→ Stable"}
                            </span>
                          )}
                          <button
                            onClick={() => enterTrackHome(track)}
                            className="text-[12px] font-medium px-2.5 py-1 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            style={{ color, borderColor: `${color}50` }}
                          >
                            Practice →
                          </button>
                        </div>
                      </div>

                      {/* Track assessment */}
                      {trackData.assessment && (
                        <p className="text-[13px] text-gray-500 mb-3 leading-relaxed">{trackData.assessment}</p>
                      )}

                      {/* Gaps */}
                      {gaps.length > 0 && (
                        <div className="space-y-3 mb-3">
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-red-500">
                            Knowledge gaps ({gaps.length})
                          </div>
                          {gaps.map((gap) => {
                            const dimLabel = allDims.find((d) => d.key === gap.dimension_key)?.label || gap.dimension_key.replace(/_/g, " ");
                            return <GapCard key={gap.dimension_key} gap={gap} dimLabel={dimLabel} />;
                          })}
                        </div>
                      )}

                      {/* Strengths */}
                      {strengthKeys.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mb-2">Strengths</div>
                          <div className="flex flex-wrap gap-2">
                            {strengthKeys.map((key) => {
                              const label = allDims.find((d) => d.key === key)?.label || key.replace(/_/g, " ");
                              return (
                                <span key={key} className="text-[12px] px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 font-medium">
                                  ✓ {label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Practice consistency ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <h2 className="font-semibold mb-4">Practice consistency — last 12 weeks</h2>
            <WeeklyHeatmap sessions={allSessions} />
          </div>
        </div>
      )}
    </div>
  );
}
