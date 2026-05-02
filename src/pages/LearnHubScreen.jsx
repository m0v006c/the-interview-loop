import { useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { SD_LEARNING } from "@/data/learning/system_design";
import { LLD_LEARNING } from "@/data/learning/low_level_design";
import { HLD_CONTENT } from "@/data/learning/hld_content";
import { LLD_CONTENT } from "@/data/learning/lld_content";

const CONTENT_MAP = { hld: HLD_CONTENT, lld: LLD_CONTENT };

const TRACKS = [
  { key: "hld", label: "System Design (HLD)", data: SD_LEARNING },
  { key: "lld", label: "Low-Level Design (LLD)", data: LLD_LEARNING },
];

const TAG_STYLES = {
  tech:    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20",
  pattern: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
  algo:    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  concept: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
};

const TRACK_ACCENT = {
  hld: { active: "text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500", num: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", header: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" },
  lld: { active: "text-indigo-700 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500", num: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400", header: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30" },
};

function StageCard({ stage, trackKey, onTopicClick }) {
  const [open, setOpen] = useState(false);
  const col = TRACK_ACCENT[trackKey];
  const content = CONTENT_MAP[trackKey];

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-xl overflow-hidden transition-colors ${open ? "border-gray-300 dark:border-gray-600" : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"}`}>
      {/* Header row */}
      <button
        className="w-full text-left px-5 py-4 flex items-center gap-4"
        onClick={() => setOpen(v => !v)}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-semibold flex-shrink-0 ${col.num}`}>
          {String(stage.num).padStart(2, "0")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm leading-snug">{stage.title}</div>
          <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{stage.subtitle}</div>
          {/* Topic preview pills */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {stage.topics.slice(0, 3).map((t) => (
              <span key={t.name} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {t.name.split(" ")[0]}
              </span>
            ))}
            {stage.topics.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                +{stage.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
        <span className={`text-gray-400 text-xs flex-shrink-0 transition-transform duration-150 ${open ? "rotate-90" : ""}`}>▶</span>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4">
          {/* Problem statement */}
          {stage.problem && (
            <div className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-4 border-l-2 ${trackKey === "hld" ? "border-emerald-400 dark:border-emerald-500" : "border-indigo-400 dark:border-indigo-500"}`}>
              {stage.problem}
            </div>
          )}

          {/* Topics */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
              Sub-topics covered ({stage.topics.length})
            </div>
            <ul className="space-y-1.5">
              {stage.topics.map((t, ti) => {
                const hasContent = !!content?.[`${stage.num}-${ti}`];
                return (
                  <li key={t.name}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onTopicClick(stage.num, ti); }}
                      className="w-full text-left flex items-start gap-2.5 text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[0.4rem] ${hasContent ? "bg-emerald-400 dark:bg-emerald-500" : "border border-gray-300 dark:border-gray-600"}`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.name}</span>
                        <span className="text-gray-500 dark:text-gray-400"> — {t.desc}</span>
                      </div>
                      <span className="text-gray-300 dark:text-gray-600 text-xs flex-shrink-0">→</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Comparison tags */}
          {stage.comparisons?.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                Key comparisons ({stage.comparisons.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stage.comparisons.map((c) => (
                  <span key={c.text} className={`text-[11px] font-mono px-2 py-0.5 rounded border ${TAG_STYLES[c.type] || TAG_STYLES.concept}`}>
                    {c.text}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StandaloneCard({ item }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-3.5 flex items-start gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold flex-shrink-0 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
        {String(item.num).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-snug">{item.title}</div>
        <div className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{item.subtitle}</div>
      </div>
    </div>
  );
}

export default function LearnHubScreen() {
  const [activeTrack, setActiveTrack] = useState("hld");
  const [expandAll, setExpandAll] = useState(false);
  const enterLearnReading = useInterviewStore((s) => s.enterLearnReading);

  const handleTopicClick = (stageNum, topicIdx) => {
    const trackId = activeTrack === "hld" ? "system_design" : "low_level_design";
    enterLearnReading(trackId, stageNum, topicIdx);
  };

  const current = TRACKS.find(t => t.key === activeTrack);
  const data = current.data;
  const col = TRACK_ACCENT[activeTrack];

  // Stats
  const totalTopics = data.stages.reduce((n, s) => n + s.topics.length, 0);

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">Learning Hub</h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          Problem-driven learning for System Design & Low-Level Design. Every concept emerges from a real need — never taught in isolation.
        </p>
        <div className="flex justify-center gap-8 mt-4">
          {[
            { label: "HLD Topics", value: "~80", color: "text-emerald-600" },
            { label: "LLD Topics", value: "~52", color: "text-indigo-600" },
            { label: "Journey Stages", value: "14+10" },
            { label: "Deep-dives", value: "32" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-xl font-semibold ${s.color || ""}`}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Track tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {TRACKS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTrack(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTrack === t.key
                ? `${TRACK_ACCENT[t.key].active}`
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Journey header */}
      <div className={`border rounded-xl p-5 mb-5 ${col.header}`}>
        <h2 className="font-semibold text-sm mb-1.5 leading-snug">{data.journeyTitle}</h2>
        <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{data.journeyDesc}</p>
        <div className="flex flex-wrap gap-1.5">
          {data.evolutionChips.map((c) => (
            <span key={c} className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/70 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-white/60 dark:border-white/10">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Expand/Collapse all */}
      <button
        onClick={() => setExpandAll(v => !v)}
        className="text-[12px] text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4"
      >
        {expandAll ? "Collapse all" : "Expand all"}
      </button>

      {/* Stage cards */}
      <div className="space-y-2 mb-8">
        {data.stages.map((stage) => (
          <StageCard key={stage.num} stage={stage} trackKey={activeTrack} onTopicClick={handleTopicClick} />
        ))}
      </div>

      {/* Standalone deep-dives */}
      <div>
        <h3 className="font-semibold text-base mb-1">Standalone deep-dives</h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-4">
          {activeTrack === "hld"
            ? "Important concepts that didn't emerge organically from the social media journey."
            : "Design patterns and architectural concepts not covered in the ride-sharing journey."}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.standalone.map((item) => (
            <StandaloneCard key={item.num} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
