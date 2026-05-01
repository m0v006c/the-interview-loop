/**
 * KeyMomentsList — expandable cards showing key moments from the interview
 * with the candidate's response, expected response, and gap.
 */

const SEVERITY_STYLES = {
  major: {
    chip: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    chipLabel: "Major",
    border: "border-gray-200 dark:border-gray-800",
    answerBg: "bg-red-50 dark:bg-red-500/10",
    answerBorder: "border-red-100 dark:border-red-500/20",
  },
  minor: {
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    chipLabel: "Minor",
    border: "border-gray-200 dark:border-gray-800",
    answerBg: "bg-amber-50 dark:bg-amber-500/10",
    answerBorder: "border-amber-100 dark:border-amber-500/20",
  },
  positive: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    chipLabel: "✓ Strong",
    border: "border-emerald-200 dark:border-emerald-500/30",
    answerBg: "bg-emerald-50 dark:bg-emerald-500/10",
    answerBorder: "border-emerald-100 dark:border-emerald-500/20",
  },
};

function shortLabel(moment) {
  // Pick a concise headline. Prefer the gap (since it's already a 1-liner),
  // fall back to the question.
  return moment.gap || moment.question || "Untitled moment";
}

function MomentCard({ moment }) {
  const sev = SEVERITY_STYLES[moment.severity] || SEVERITY_STYLES.minor;
  const isPositive = moment.severity === "positive";

  return (
    <details className={`group bg-white dark:bg-gray-900 rounded-xl border ${sev.border} shadow-sm`}>
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sev.chip}`}>
          {sev.chipLabel}
        </span>
        {moment.phase && (
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            {String(moment.phase).replace(/_/g, " ")}
          </span>
        )}
        <span className="flex-1 text-sm font-medium truncate">{shortLabel(moment)}</span>
        <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">›</span>
      </summary>

      <div className="px-4 pb-4 pt-1 space-y-3 text-sm">
        {moment.question && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
              Interviewer asked
            </div>
            <div className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
              "{moment.question}"
            </div>
          </div>
        )}

        {!isPositive ? (
          <div className="grid md:grid-cols-2 gap-3">
            {moment.candidate_response && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold mb-1">
                  Your answer
                </div>
                <div className={`${sev.answerBg} border ${sev.answerBorder} rounded-lg p-3 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap`}>
                  {moment.candidate_response}
                </div>
              </div>
            )}
            {moment.expected_response && (
              <div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                  Expected answer
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {moment.expected_response}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Positive moment: just show the candidate's response in green
          moment.candidate_response && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
                What you said
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg p-3 text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {moment.candidate_response}
              </div>
            </div>
          )
        )}

        {moment.gap && (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">
              {isPositive ? "Why this matters" : "The gap"}
            </div>
            <div className="text-gray-600 dark:text-gray-400 leading-relaxed">{moment.gap}</div>
          </div>
        )}
      </div>
    </details>
  );
}

export default function KeyMomentsList({ moments }) {
  if (!moments || moments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-500">
        No key moments were extracted for this session.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {moments.map((m, i) => (
        <MomentCard key={i} moment={m} />
      ))}
    </div>
  );
}
