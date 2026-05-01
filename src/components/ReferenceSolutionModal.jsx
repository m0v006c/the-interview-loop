import { useEffect, useRef, useState } from "react";

// ─── Mermaid renderer (lazy-loaded so the ~1 MB bundle only loads on demand) ──

function MermaidDiagram({ code }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ref.current || !code) return;
    let cancelled = false;
    import("mermaid").then(({ default: mermaid }) => {
      if (cancelled) return;
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          flowchart: { curve: "basis" },
          fontSize: 13,
        });
        const id = "mmd-" + Math.random().toString(36).slice(2);
        mermaid.render(id, code.trim()).then(({ svg }) => {
          if (ref.current && !cancelled) {
            ref.current.innerHTML = svg;
          }
        }).catch((e) => {
          if (!cancelled) setError(e?.message || "Diagram render failed");
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Diagram init failed");
      }
    });
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <pre className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-[11px] text-red-500 overflow-x-auto">
        {/* Fallback: show raw mermaid code if render fails */}
        {code}
      </pre>
    );
  }
  return (
    <div
      ref={ref}
      className="bg-white dark:bg-gray-950 rounded-lg p-3 overflow-x-auto border border-gray-100 dark:border-gray-800 my-2 [&_svg]:max-w-full"
    />
  );
}

// ─── Mini markdown renderer ──────────────────────────────────────────────────
//
// Handles:
//  • ```mermaid ... ``` → MermaidDiagram component
//  • ``` ... ```        → <pre><code> block (existing)
//  • Lines starting with - or • → <ul><li> list group
//  • **text**           → <strong>
//  • Regular paragraphs → <p>

function renderInline(text) {
  // Bold: **text**
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i}>{p}</strong> : p
  );
}

function renderContent(raw) {
  if (!raw) return null;

  // Split on fenced code blocks first
  const fenceRe = /```(\w+)?\n?([\s\S]*?)```/g;
  const segments = [];
  let lastIdx = 0;
  let m;

  while ((m = fenceRe.exec(raw)) !== null) {
    if (m.index > lastIdx) {
      segments.push({ type: "text", content: raw.slice(lastIdx, m.index) });
    }
    const lang = (m[1] || "").toLowerCase();
    if (lang === "mermaid") {
      segments.push({ type: "mermaid", content: m[2] });
    } else {
      segments.push({ type: "code", lang, content: m[2] });
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < raw.length) {
    segments.push({ type: "text", content: raw.slice(lastIdx) });
  }

  return segments.map((seg, si) => {
    if (seg.type === "mermaid") {
      return <MermaidDiagram key={si} code={seg.content} />;
    }
    if (seg.type === "code") {
      return (
        <pre key={si} className="bg-gray-900 text-gray-100 rounded-lg p-4 text-[12px] leading-[1.6] overflow-x-auto my-2">
          <code>{seg.content.replace(/\n$/, "")}</code>
        </pre>
      );
    }

    // Text segment: group consecutive bullet lines into a single <ul>
    const lines = seg.content.split("\n");
    const nodes = [];
    let bulletBuffer = [];

    const flushBullets = () => {
      if (bulletBuffer.length > 0) {
        nodes.push(
          <ul key={`ul-${nodes.length}`} className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
            {bulletBuffer.map((b, i) => (
              <li key={i}>{renderInline(b)}</li>
            ))}
          </ul>
        );
        bulletBuffer = [];
      }
    };

    lines.forEach((line, li) => {
      const bullet = line.match(/^[\-•]\s+(.+)/);
      if (bullet) {
        bulletBuffer.push(bullet[1]);
      } else {
        flushBullets();
        const trimmed = line.trim();
        if (trimmed) {
          nodes.push(
            <p key={`p-${li}`} className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
              {renderInline(trimmed)}
            </p>
          );
        }
      }
    });
    flushBullets();

    return <div key={si} className="space-y-2">{nodes}</div>;
  });
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export default function ReferenceSolutionModal({ open, onClose, problemTitle, idealSolution }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center px-5 py-10 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="text-base font-semibold tracking-tight">Reference solution</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {problemTitle ? `${problemTitle} · ` : ""}How an experienced candidate would walk through this
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">
          {!idealSolution ? (
            <div className="text-sm text-gray-500 leading-relaxed">
              No reference solution was generated for this session. Try completing a new session and it will appear here.
            </div>
          ) : (
            <>
              {idealSolution.summary && (
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Short version:</span>{" "}
                  {idealSolution.summary}
                </div>
              )}

              {(idealSolution.sections || []).map((section, i) => (
                <section key={i}>
                  <h3 className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-3">
                    {section.title}
                  </h3>
                  {/* Dedicated diagram field — no escaping issues */}
                  {section.diagram && (
                    <div className="mb-3">
                      <MermaidDiagram code={section.diagram} />
                    </div>
                  )}
                  <div className="space-y-2">
                    {renderContent(section.content)}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
