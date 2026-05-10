import { useState, useEffect } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";

// ── Track snippet data ────────────────────────────────────────────
const TRACKS = [
  {
    id: "system_design", icon: "🏛️", label: "System Design",
    accent: "indigo", problem: "Design Twitter's Feed",
    tag: "50+ problems · 7 scored dimensions",
    chat: [
      { ai: true,  text: "Your fanout-on-write approach works at 1M users. What breaks first at 500M?" },
      { ai: false, text: "The celebrity problem — accounts with 100M followers would push to millions of feeds on every tweet." },
      { ai: true,  text: "Exactly. So you'd switch to fanout-on-read for them. How do you decide the threshold, and who owns that classification?" },
      { ai: false, text: "A user-tier service — maybe based on follower count. We'd precompute it nightly and cache the flag." },
      { ai: true,  text: "Good instinct. Now what happens if a celebrity goes viral overnight and crosses the threshold mid-day?" },
    ],
  },
  {
    id: "behavioral", icon: "💬", label: "Behavioral",
    accent: "pink", problem: "Conflict & Influence",
    tag: "STAR-probed · 6 dimensions · voice-first",
    chat: [
      { ai: true,  text: "Tell me about a time you strongly disagreed with a technical decision the team made." },
      { ai: false, text: "We were migrating to microservices on an aggressive timeline. I felt our test coverage was too low to do it safely..." },
      { ai: true,  text: "You said you 'felt' it was risky. Did you have data, or was this intuition at that point?" },
      { ai: false, text: "Both. I pulled our deployment failure rate — it was 3× higher during our last service split six months prior." },
      { ai: true,  text: "Good. And when you presented that data, what was the room's reaction — and how did you handle the pushback?" },
    ],
  },
  {
    id: "problem_solving", icon: "🧩", label: "Problem Solving",
    accent: "sky", problem: "Meeting Rooms II",
    tag: "Company-pattern problems · code editor",
    chat: [
      { ai: true,  text: "Your O(n²) brute force is correct. Walk me through how you'd optimise it." },
      { ai: false, text: "Sort by start time, use a min-heap tracking end times — we get O(n log n) with O(n) space." },
      { ai: true,  text: "Right. When does the O(n) space become a real problem in production?" },
      { ai: false, text: "At very high scale. We'd stream meetings in batches rather than loading all into memory." },
      { ai: true,  text: "Nice. One edge case — two meetings start at the exact same millisecond. Does your heap handle that correctly?" },
    ],
  },
  {
    id: "low_level_design", icon: "🧱", label: "Low-Level Design",
    accent: "emerald", problem: "Parking Lot System",
    tag: "OOP · patterns · SOLID principles",
    chat: [
      { ai: true,  text: "Your design handles single-entry lots well. How would you extend it to support monthly subscriptions?" },
      { ai: false, text: "I'd add a Subscription class and a SubscriptionStrategy for pricing — Strategy pattern." },
      { ai: true,  text: "You're jumping to implementation. What entities change, and what new relationships are you introducing first?" },
      { ai: false, text: "Fair — Vehicle, Spot, and Billing all need to understand subscriptions. Let me revisit the class diagram." },
      { ai: true,  text: "Good catch. Now show me how the Open/Closed Principle applies to adding a new pass type without touching existing classes." },
    ],
  },
];

const ACCENT = {
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-500/10",  border: "border-indigo-200 dark:border-indigo-500/30",  text: "text-indigo-600 dark:text-indigo-400",  bubble: "bg-indigo-600",  ring: "ring-indigo-500" },
  pink:    { bg: "bg-pink-50 dark:bg-pink-500/10",      border: "border-pink-200 dark:border-pink-500/30",      text: "text-pink-600 dark:text-pink-400",      bubble: "bg-pink-600",    ring: "ring-pink-500" },
  sky:     { bg: "bg-sky-50 dark:bg-sky-500/10",        border: "border-sky-200 dark:border-sky-500/30",        text: "text-sky-600 dark:text-sky-400",        bubble: "bg-sky-600",     ring: "ring-sky-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10",border: "border-emerald-200 dark:border-emerald-500/30",text: "text-emerald-600 dark:text-emerald-400",bubble: "bg-emerald-600", ring: "ring-emerald-500" },
};

const DIMENSIONS = ["Requirements", "High-level design", "Deep dive", "Trade-offs", "Scaling", "Communication"];
const SCORES     = [4, 3, 5, 4, 3, 4];

// ── Small reusable bits ───────────────────────────────────────────

function NavBar({ onSignIn, onStart, isLoggedIn, goToDashboard }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const onDark = !scrolled;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${scrolled ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur border-b border-gray-200/50 dark:border-gray-800/50" : ""}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[10px]">IL</div>
          <span className={`font-semibold text-sm tracking-tight ${onDark ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
            The Interview Loop
          </span>
        </div>
        <div className={`hidden md:flex items-center gap-7 text-sm ${onDark ? "text-gray-300" : "text-gray-600 dark:text-gray-400"}`}>
          <a href="#tracks" className={`transition-colors ${onDark ? "hover:text-white" : "hover:text-gray-900 dark:hover:text-gray-200"}`}>Tracks</a>
          <a href="#how-it-works" className={`transition-colors ${onDark ? "hover:text-white" : "hover:text-gray-900 dark:hover:text-gray-200"}`}>How it works</a>
          <a href="#analytics" className={`transition-colors ${onDark ? "hover:text-white" : "hover:text-gray-900 dark:hover:text-gray-200"}`}>Analytics</a>
          <a href="#pricing" className={`transition-colors ${onDark ? "hover:text-white" : "hover:text-gray-900 dark:hover:text-gray-200"}`}>Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <button onClick={goToDashboard} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
              Go to dashboard →
            </button>
          ) : (
            <>
              <button onClick={onSignIn} className={`text-sm transition-colors ${onDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"}`}>Sign in</button>
              <button onClick={onStart} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
                Start free →
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function ChatBubble({ msg, accent }) {
  const a = ACCENT[accent] || ACCENT.indigo;
  return (
    <div className={`flex gap-2 ${msg.ai ? "" : "flex-row-reverse"}`}>
      {msg.ai && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5">AI</div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
        msg.ai
          ? "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 rounded-tl-sm"
          : `${a.bubble} text-white rounded-tr-sm`
      }`}>
        {msg.text}
      </div>
    </div>
  );
}

function ScoreDemoBar({ score }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "#10B981" : score >= 3 ? "#F59E0B" : "#EF4444";
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function PublicLanding() {
  const [activeTrack, setActiveTrack] = useState(0);
  const openSignIn    = useAuthStore((s) => s.openSignIn);
  const user          = useAuthStore((s) => s.user);
  const enterTrackHome = useInterviewStore((s) => s.enterTrackHome);
  const enterPricing   = useInterviewStore((s) => s.enterPricing);
  const goLanding      = useInterviewStore((s) => s.goLanding);

  const handleStart = () => openSignIn();
  const track = TRACKS[activeTrack];
  const a = ACCENT[track.accent];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <NavBar onSignIn={openSignIn} onStart={handleStart} isLoggedIn={!!user} goToDashboard={goLanding} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                AI-powered mock interviews
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-5">
                Real interviews<br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  don't follow a script.
                </span><br />
                Neither do we.
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-8 max-w-md">
                Practice with an AI that cross-questions, deep dives, and challenges your assumptions — just like a senior engineer at Google, Meta, or Stripe would.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleStart} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors text-sm">
                  Start your first mock — free →
                </button>
                <a href="#tracks" className="px-6 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium transition-colors text-sm">
                  See all tracks ↓
                </a>
              </div>
              <p className="text-gray-600 text-xs mt-4">No credit card. 4 interview tracks. Instant AI feedback.</p>
            </div>

            {/* Right — hero chat card */}
            <div className="relative">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                {/* Card header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/80">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <span className="text-gray-300 text-[13px] font-medium">System Design · Design Twitter's Feed</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Live session</span>
                </div>
                {/* Chat */}
                <div className="p-4 space-y-3">
                  {[
                    { ai: true,  text: "Good start. Your fanout-on-write handles 1M users. What breaks first at 500M?" },
                    { ai: false, text: "Celebrity accounts — pushing to 100M feeds on every tweet would be too slow." },
                    { ai: true,  text: "Exactly. How do you decide the threshold for switching to fanout-on-read, and who owns that classification at runtime?" },
                    { ai: false, text: "A user-tier service precomputed nightly, cached behind the write path..." },
                    { ai: true,  text: "Smart. What happens if a celebrity goes viral mid-day and crosses the threshold before the next batch?" },
                  ].map((m, i) => (
                    <ChatBubble key={i} msg={m} accent="indigo" />
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-8 rounded-xl bg-gray-800 border border-gray-700 flex items-center px-3">
                      <span className="text-gray-600 text-[12px]">We'd need a real-time update trigger...</span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs">↑</div>
                  </div>
                </div>
              </div>

              {/* Floating score card */}
              <div className="absolute -bottom-6 -left-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 shadow-xl w-44">
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">Live score</div>
                <div className="text-[22px] font-bold text-indigo-600">3.8<span className="text-sm text-gray-400 font-normal">/5</span></div>
                <div className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-block font-medium">LEAN HIRE</div>
                <div className="mt-2 space-y-1">
                  {["Trade-offs", "Scaling", "Depth"].map((d, i) => (
                    <div key={d} className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${[65, 55, 75][i]}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            ["50+", "practice problems"],
            ["4", "interview tracks"],
            ["7", "scored dimensions"],
            ["AI", "generated problems"],
            ["Free", "to start"],
          ].map(([num, label]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="font-bold text-gray-900 dark:text-gray-100">{num}</span>
              <span className="text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM SECTION ──────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              You've solved the problem 10 times.<br />
              <span className="text-gray-400">You still froze.</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-[15px] leading-relaxed">
              Most prep platforms give you polished answers to fixed questions. Real Big Tech interviews work completely differently.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Standard prep */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Standard prep</div>
              <div className="space-y-3">
                {[
                  ["📖", "Memorise canonical answers to known problems"],
                  ["🔁", "Same fixed deep-dive questions every run"],
                  ["😰", "Interviewer deviates → confidence collapses"],
                  ["🎯", "Score on what you know, not how you think"],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-3 text-[13px] text-gray-600 dark:text-gray-400">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TIL */}
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 p-6 bg-indigo-50/50 dark:bg-indigo-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl" />
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-4">The Interview Loop</div>
              <div className="space-y-3">
                {[
                  ["🤖", "AI that adapts — every session takes a different path"],
                  ["🎲", "AI-curated problems that sound simple but test judgment"],
                  ["💡", "Train to drive the interview, not just answer it"],
                  ["📊", "Scored on thought process, depth, and communication"],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-3 text-[13px] text-gray-700 dark:text-gray-300">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THREE PILLARS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-3">Why it works</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built around how real interviews work</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: "🔀",
                title: "Every session is genuinely different",
                body: "Our AI doesn't have a script. It picks up on what you say, challenges your assumptions, and digs into whatever feels weakest — just like a senior engineer who's never seen your prep sheet.",
              },
              {
                icon: "🎲",
                title: "Out-of-box problems that judge your thinking",
                body: "Big Tech companies — especially in the US and Europe — throw problems that sound deceptively simple. We curate the same kind: scenarios where the thought process IS the answer, not the solution.",
              },
              {
                icon: "🧭",
                title: "Learn to drive, not just respond",
                body: "The best candidates lead the interview. We score you on how you frame problems, articulate trade-offs, and recover from curveballs — not just whether you got the right answer.",
              },
            ].map((p) => (
              <div key={p.title} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="text-2xl mb-4">{p.icon}</div>
                <h3 className="font-semibold text-[15px] mb-2 leading-snug">{p.title}</h3>
                <p className="text-gray-500 text-[13px] leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRACK SHOWCASE ───────────────────────────────────── */}
      <section id="tracks" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-3">Four tracks</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Practice every interview format</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-[15px]">Each track is tuned for how that round actually runs — the flow, the scoring dimensions, and the AI's questioning style.</p>
          </div>

          {/* Track tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {TRACKS.map((t, i) => {
              const ac = ACCENT[t.accent];
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTrack(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                    activeTrack === i
                      ? `${ac.bg} ${ac.border} ${ac.text}`
                      : "border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  <span>{t.icon}</span>{t.label}
                </button>
              );
            })}
          </div>

          {/* Active track panel */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {/* Chat snippet */}
            <div className={`rounded-2xl border p-5 ${a.bg} ${a.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${a.text} mb-0.5`}>{track.label}</div>
                  <div className="text-sm font-semibold">{track.problem}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${a.bg} ${a.border} ${a.text}`}>
                  {track.tag.split("·")[0].trim()}
                </span>
              </div>
              <div className="space-y-2.5 bg-white/60 dark:bg-gray-900/60 rounded-xl p-3 backdrop-blur-sm">
                {track.chat.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} accent={track.accent} />
                ))}
              </div>
            </div>

            {/* Track details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{track.label} track</h3>
                <p className="text-gray-500 text-[14px] leading-relaxed">
                  {track.id === "system_design" && "Design scalable systems under a dynamic interviewer that probes every assumption. You drive the architecture — the AI challenges your depth, consistency, and trade-off reasoning."}
                  {track.id === "behavioral" && "Conversational behavioral rounds probed with STAR follow-ups. The AI pushes on specificity, ownership, and impact — exactly how top interviewers probe for signal."}
                  {track.id === "problem_solving" && "Coding interviews with a clarify → approach → implement → test flow. Problems are grouped by company pattern — Amazon graphs, Google DP, Meta strings."}
                  {track.id === "low_level_design" && "OOP design with real classes, patterns, and SOLID principles. Classic problems like parking lot, chess, and LRU cache — scored on modeling quality and extensibility."}
                </p>
              </div>

              <div className="space-y-2">
                {track.tag.split("·").map((t) => (
                  <div key={t} className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${a.bubble}`} />
                    {t.trim()}
                  </div>
                ))}
              </div>

              <button
                onClick={() => user ? enterTrackHome(track.id) : openSignIn()}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${a.bubble} hover:opacity-90`}
              >
                Try {track.label} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SCORING PREVIEW ──────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-3">Detailed feedback</div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Know exactly where you stand</h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-6">
                Every session ends with a structured scorecard across the dimensions that actually matter to interviewers — not just "good" or "bad." You get a verdict, a score per dimension, and actionable feedback on what to improve.
              </p>
              <div className="space-y-2 text-[13px] text-gray-600 dark:text-gray-400">
                {["STRONG HIRE / HIRE / LEAN HIRE / NO HIRE verdict", "Score per dimension with specific feedback", "Top strength + key improvement area", "Per-question breakdown for behavioral rounds"].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span> {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Score card mockup */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
              <div className="text-center mb-5">
                <span className="inline-block px-5 py-1.5 rounded-full bg-amber-500 text-white font-semibold text-sm tracking-wide">LEAN HIRE</span>
                <div className="text-[32px] font-bold mt-2">3.7<span className="text-base text-gray-400 font-normal"> / 5.0</span></div>
                <div className="text-xs text-gray-400">System Design · Design Twitter's Feed · 38 min</div>
              </div>
              <div className="space-y-3 mb-5">
                {DIMENSIONS.map((d, i) => (
                  <div key={d}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-gray-500">{d}</span>
                      <span className="font-medium">{SCORES[i]}/5</span>
                    </div>
                    <ScoreDemoBar score={SCORES[i]} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-3">
                  <div className="text-[11px] text-emerald-600 font-medium">Top strength</div>
                  <div className="text-[12px] mt-1 text-gray-700 dark:text-gray-300">Strong initial requirements gathering</div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl p-3">
                  <div className="text-[11px] text-amber-600 font-medium">Top improvement</div>
                  <div className="text-[12px] mt-1 text-gray-700 dark:text-gray-300">Articulate trade-offs more proactively</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYTICS & BREAKDOWN ────────────────────────────── */}
      <section id="analytics" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-3">Track your growth</div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Know exactly where you're improving
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto text-[15px] leading-relaxed">
              Every session feeds into a live performance dashboard. See which dimensions you're nailing, which need work, and how your scores trend over time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Skill breakdown card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-lg">📊</div>
                <div>
                  <div className="font-semibold text-[15px]">Skill Breakdown</div>
                  <div className="text-[12px] text-gray-400">Weighted across difficulty, time, and recency</div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Trade-off analysis",    score: 4.2, track: "System Design" },
                  { label: "STAR structure",         score: 3.8, track: "Behavioral" },
                  { label: "Optimization depth",    score: 3.1, track: "Problem Solving" },
                  { label: "Extensibility",          score: 4.5, track: "Low-Level Design" },
                  { label: "Communication",          score: 4.0, track: "All tracks" },
                ].map((d) => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700 dark:text-gray-300">{d.label}</span>
                        <span className="text-gray-400 text-[10px]">· {d.track}</span>
                      </div>
                      <span className={`font-semibold ${d.score >= 4 ? "text-emerald-600" : d.score >= 3 ? "text-amber-500" : "text-red-500"}`}>
                        {d.score}/5
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${(d.score / 5) * 100}%`,
                        background: d.score >= 4 ? "#10B981" : d.score >= 3 ? "#F59E0B" : "#EF4444"
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics features */}
            <div className="space-y-4">
              {[
                {
                  icon: "📈",
                  title: "Skill trend by track",
                  body: "See your score trajectory over your last 10 sessions per track — improving, stable, or declining. Sparkline charts make the trend immediately visible.",
                },
                {
                  icon: "🎯",
                  title: "Interview readiness score",
                  body: "A single % score synthesised from your latest performance across all four tracks. Know when you're ready — not just when you feel ready.",
                },
                {
                  icon: "🤖",
                  title: "AI weekly improvement plan",
                  body: "Every week, AI analyses your sessions and generates a personalised plan: knowledge gaps, action steps for your next interview, and curated reading resources for each weak dimension.",
                },
                {
                  icon: "🗓️",
                  title: "Practice consistency heatmap",
                  body: "A 12-week GitHub-style activity grid. Consistent short sessions beat cramming — and now you can see whether you're building the habit.",
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors bg-white dark:bg-gray-900">
                  <span className="text-xl shrink-0 mt-0.5">{f.icon}</span>
                  <div>
                    <div className="font-semibold text-[14px] mb-1">{f.title}</div>
                    <div className="text-gray-500 text-[13px] leading-relaxed">{f.body}</div>
                  </div>
                </div>
              ))}
              <div className="text-[12px] text-gray-400 px-1">
                Advanced analytics available on the <span className="text-purple-500 font-medium">Pro plan</span>.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE ────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-950 dark:bg-black">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-4xl text-gray-600 mb-4">"</div>
          <blockquote className="text-xl md:text-2xl text-gray-200 font-medium leading-relaxed mb-6">
            The difference between a candidate who gets an offer and one who doesn't usually isn't knowledge.
            It's the ability to think out loud, recover from a curveball, and make the interviewer feel like
            they'd enjoy building with you.
          </blockquote>
          <p className="text-gray-500 text-sm">The Interview Loop — built to develop exactly this.</p>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 mb-3">Pricing</div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Start free. Upgrade when you're serious.</h2>
            <p className="text-gray-500 text-[15px]">All plans include access to 4 tracks and instant AI feedback.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Free", price: "$0", desc: "Explore the platform.", color: "gray", features: ["4 interviews / month", "3 problems per track", "Full AI scoring", "1 AI-generated problem"] },
              { name: "Starter", price: "$12", desc: "Regular practice with full feedback.", color: "indigo", features: ["20 interviews / month", "All 50+ problems", "5 AI-generated problems / month", "Reference solutions", "Key moments feedback"] },
              { name: "Pro", price: "$19", desc: "Unlimited for serious candidates.", color: "purple", popular: true, features: ["Unlimited interviews", "All 50+ problems", "Unlimited AI problems", "Advanced analytics & trends", "Priority support"] },
            ].map((p) => (
              <div key={p.name} className={`rounded-2xl border p-6 flex flex-col relative ${
                p.popular
                  ? "border-purple-300 dark:border-purple-500/40 bg-gradient-to-b from-purple-50 to-white dark:from-purple-500/10 dark:to-gray-950"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
              }`}>
                {p.popular && <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-600 dark:text-purple-400 mb-2">Most popular</div>}
                <div className="font-bold text-lg mb-1">{p.name}</div>
                <div className="text-[13px] text-gray-500 mb-4">{p.desc}</div>
                <div className="text-3xl font-bold mb-5">{p.price}<span className="text-sm text-gray-400 font-normal">{p.price !== "$0" ? "/mo" : ""}</span></div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-gray-600 dark:text-gray-400">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={p.name === "Free" ? handleStart : enterPricing}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    p.popular ? "bg-purple-600 hover:bg-purple-700 text-white" :
                    p.name === "Starter" ? "bg-indigo-600 hover:bg-indigo-700 text-white" :
                    "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {p.name === "Free" ? "Start free →" : `Get ${p.name} →`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-950 to-gray-900 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Your next interview will surprise you.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">So should your prep.</span>
          </h2>
          <p className="text-gray-400 mb-8 text-[15px]">Start your first mock interview free — no credit card, no setup. Just you and an AI that asks the questions you didn't prepare for.</p>
          <button onClick={handleStart} className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[15px] transition-colors">
            Start practicing free →
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 bg-gray-950 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-[9px]">IL</div>
            <span className="text-gray-400 text-sm">The Interview Loop</span>
          </div>
          <div className="flex items-center gap-6 text-gray-600 text-sm">
            <a href="#tracks" className="hover:text-gray-400 transition-colors">Tracks</a>
            <a href="#pricing" className="hover:text-gray-400 transition-colors">Pricing</a>
            <a href="mailto:theinterviewloop@gmail.com" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
          <div className="text-gray-700 text-xs">© 2025 The Interview Loop</div>
        </div>
      </footer>
    </div>
  );
}
