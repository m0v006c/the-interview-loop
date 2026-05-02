import { useState } from "react";
import { useInterviewStore } from "@/lib/store";
import { SD_LEARNING } from "@/data/learning/system_design";
import { LLD_LEARNING } from "@/data/learning/low_level_design";
import { HLD_CONTENT } from "@/data/learning/hld_content";
import { LLD_CONTENT } from "@/data/learning/lld_content";

const LEARNING_DATA = {
  system_design:    SD_LEARNING,
  low_level_design: LLD_LEARNING,
};
const TOPIC_CONTENT = {
  system_design:    HLD_CONTENT,
  low_level_design: LLD_CONTENT,
};

const TRACK_ACCENT = {
  system_design:    { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", activeToc: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-l-2 border-emerald-500", concept: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  low_level_design: { bar: "bg-indigo-500",  text: "text-indigo-600 dark:text-indigo-400",   activeToc: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-l-2 border-indigo-500",   concept: "bg-indigo-50 text-indigo-700 border-indigo-100"   },
};

// ─── Block renderers ──────────────────────────────────────────────

function Para({ text }) {
  return <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-[15px]">{text}</p>;
}
function H3({ text }) {
  return <h3 className="font-semibold text-base mt-1">{text}</h3>;
}
function CodeBlock({ lang, code }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 text-sm">
      {lang && lang !== "text" && (
        <div className="bg-gray-800 px-4 py-1.5 text-[11px] text-gray-400 font-mono">{lang}</div>
      )}
      <pre className="bg-gray-900 text-gray-100 p-4 text-[12.5px] leading-[1.7] overflow-x-auto font-mono"><code>{code}</code></pre>
    </div>
  );
}
function Callout({ variant, title, text }) {
  const s = {
    info:    { wrap: "bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30", icon: "ℹ️", t: "text-blue-900 dark:text-blue-300", b: "text-blue-800 dark:text-blue-400" },
    tip:     { wrap: "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30", icon: "💡", t: "text-amber-900 dark:text-amber-300", b: "text-amber-800 dark:text-amber-400" },
    warning: { wrap: "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30", icon: "⚠️", t: "text-red-900 dark:text-red-300", b: "text-red-800 dark:text-red-400" },
  }[variant] || { wrap: "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700", icon: "ℹ️", t: "text-gray-900 dark:text-gray-200", b: "text-gray-700 dark:text-gray-400" };
  return (
    <div className={`${s.wrap} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span>{s.icon}</span>
        <span className={`font-semibold text-sm ${s.t}`}>{title}</span>
      </div>
      <p className={`text-sm leading-relaxed ${s.b}`}>{text}</p>
    </div>
  );
}
function InterviewTip({ text }) {
  return (
    <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span>🎯</span>
        <span className="font-semibold text-sm text-green-900 dark:text-green-300">Interview tip</span>
      </div>
      <p className="text-sm leading-relaxed text-green-800 dark:text-green-400">{text}</p>
    </div>
  );
}
function BulletList({ items }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[15px] text-gray-700 dark:text-gray-300">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0 mt-[0.45rem]" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
function NumberedList({ items }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 grid place-items-center text-indigo-700 dark:text-indigo-400 font-bold text-[11px] flex-shrink-0 font-mono">{i + 1}</div>
          <div>
            <div className="font-semibold text-sm mb-0.5">{item.title}</div>
            <div className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">{item.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderBlock(block, i) {
  switch (block.t) {
    case "p":             return <Para key={i} text={block.text} />;
    case "h3":            return <H3 key={i} text={block.text} />;
    case "code":          return <CodeBlock key={i} lang={block.lang} code={block.code} />;
    case "callout":       return <Callout key={i} variant={block.variant} title={block.title} text={block.text} />;
    case "interview-tip": return <InterviewTip key={i} text={block.text} />;
    case "bullet-list":   return <BulletList key={i} items={block.items} />;
    case "numbered-list": return <NumberedList key={i} items={block.items} />;
    default:              return null;
  }
}

// ─── Main screen ──────────────────────────────────────────────────

export default function LearnReadingScreen() {
  const learnTrack    = useInterviewStore((s) => s.learnTrack);
  const learnStageNum = useInterviewStore((s) => s.learnStageNum) || 1;
  const learnTopicIdx = useInterviewStore((s) => s.learnTopicIdx) || 0;
  const enterLearnHub = useInterviewStore((s) => s.enterLearnHub);
  const enterLearnReading = useInterviewStore((s) => s.enterLearnReading);
  const setLearnTopic = useInterviewStore((s) => s.setLearnTopic);

  const [activeStageNum, setActiveStageNum] = useState(learnStageNum);
  const [activeTopicIdx, setActiveTopicIdx] = useState(learnTopicIdx);

  const path    = LEARNING_DATA[learnTrack];
  const content = TOPIC_CONTENT[learnTrack];
  const col     = TRACK_ACCENT[learnTrack] || TRACK_ACCENT.system_design;

  const stage = path?.stages.find((s) => s.num === activeStageNum) || path?.stages[0];
  const topic = stage?.topics[activeTopicIdx];
  const contentKey = `${activeStageNum}-${activeTopicIdx}`;
  const blocks = content?.[contentKey];

  const goTo = (stageNum, topicIdx) => {
    setActiveStageNum(stageNum);
    setActiveTopicIdx(topicIdx);
    setLearnTopic(stageNum, topicIdx);
  };

  const prevTopic = () => {
    if (activeTopicIdx > 0) {
      goTo(activeStageNum, activeTopicIdx - 1);
    } else {
      const prevStage = path?.stages.find((s) => s.num === activeStageNum - 1);
      if (prevStage) goTo(prevStage.num, prevStage.topics.length - 1);
    }
  };

  const nextTopic = () => {
    if (activeTopicIdx < (stage?.topics.length || 1) - 1) {
      goTo(activeStageNum, activeTopicIdx + 1);
    } else {
      const nextStage = path?.stages.find((s) => s.num === activeStageNum + 1);
      if (nextStage) goTo(nextStage.num, 0);
    }
  };

  if (!path || !stage || !topic) return <div className="p-8 text-gray-500">Content not found.</div>;

  const totalTopics = path.stages.reduce((n, s) => n + s.topics.length, 0);
  const topicsSoFar = path.stages.filter((s) => s.num < activeStageNum).reduce((n, s) => n + s.topics.length, 0) + activeTopicIdx + 1;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left TOC */}
      <nav className="w-64 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 overflow-y-auto py-5 px-3">
        <button onClick={enterLearnHub} className="text-[12px] text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 mb-4 flex items-center gap-1 px-2">
          ← Learning Hub
        </button>

        {/* Progress */}
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1 px-2">
          {topicsSoFar} / {totalTopics} topics
        </div>
        <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4 mx-2">
          <div className={`h-full ${col.bar} rounded-full transition-all`} style={{ width: `${(topicsSoFar / totalTopics) * 100}%` }} />
        </div>

        {/* Stage + topic tree */}
        <ul className="space-y-1 text-[12px]">
          {path.stages.map((s) => (
            <li key={s.num}>
              <div className={`px-2 py-1 font-semibold text-[10px] uppercase tracking-wider mt-2 ${activeStageNum === s.num ? col.text : "text-gray-400"}`}>
                {s.num}. {s.title.split("—")[0].trim()}
              </div>
              {s.topics.map((t, ti) => {
                const isActive = activeStageNum === s.num && activeTopicIdx === ti;
                const hasContent = !!content?.[`${s.num}-${ti}`];
                return (
                  <button
                    key={ti}
                    onClick={() => goTo(s.num, ti)}
                    className={`w-full text-left pl-5 pr-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${
                      isActive ? `${col.activeToc} font-medium` : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasContent ? (isActive ? col.bar : "bg-gray-300 dark:bg-gray-600") : "border border-gray-300 dark:border-gray-600"}`} />
                    <span className="truncate">{t.name}</span>
                  </button>
                );
              })}
            </li>
          ))}
        </ul>
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <article className="max-w-3xl px-10 py-8 mx-auto">
          {/* Breadcrumb */}
          <div className={`text-[11px] uppercase tracking-wider font-semibold mb-3 ${col.text}`}>
            Stage {stage.num} · {stage.title.split("—")[1]?.trim() || stage.title}
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{topic.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">{topic.desc}</p>

          {/* Content blocks or placeholder */}
          {blocks ? (
            <div className="space-y-5">
              {blocks.map(renderBlock)}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center text-sm text-gray-400">
              <div className="text-3xl mb-3">📝</div>
              <div className="font-medium text-gray-500 mb-1">Content coming soon</div>
              <div className="text-[12px]">This topic hasn't been written yet. Use the navigation below to move to a topic that has content.</div>
            </div>
          )}

          {/* Prev / Next */}
          <div className="flex justify-between mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button onClick={prevTopic} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1">
              ← Previous
            </button>
            <button onClick={nextTopic} className={`text-sm font-medium ${col.text} flex items-center gap-1`}>
              Next →
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
