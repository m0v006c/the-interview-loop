/**
 * TranscriptCard — collapsible inline conversation log.
 * Closed by default. Expanding shows the full message-by-message exchange.
 */

function formatDuration(s) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function TranscriptCard({ messages, durationSeconds }) {
  const count = messages?.length || 0;

  if (count === 0) {
    return (
      <details className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl">
          <span className="text-base">💬</span>
          <span className="flex-1 text-sm font-medium">Conversation transcript</span>
          <span className="text-xs text-gray-400">No messages</span>
        </summary>
      </details>
    );
  }

  return (
    <details className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl">
        <span className="text-base">💬</span>
        <span className="flex-1 text-sm font-medium">Conversation transcript</span>
        <span className="text-xs text-gray-400">
          {count} message{count !== 1 ? "s" : ""}
          {durationSeconds ? ` · ${formatDuration(durationSeconds)}` : ""}
        </span>
        <span className="text-gray-400 text-xs group-open:rotate-90 transition-transform">›</span>
      </summary>
      <div className="px-4 pb-4 pt-2 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-[14px] rounded-br-[4px]"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-[14px] rounded-bl-[4px]"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}
