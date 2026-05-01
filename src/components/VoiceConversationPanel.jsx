import { useState, useRef, useEffect, useCallback } from "react";
import { useInterviewStore } from "@/lib/store";
import { useVoice } from "@/hooks/useVoice";
import { getTrack } from "@/data/tracks";

/**
 * VoiceConversationPanel
 *
 * Voice-first UI for the behavioral round. Primary interaction is speech:
 * big mic button, live transcription, and TTS for interviewer messages.
 * Keyboard input is hidden behind a toggle for accessibility only.
 */
export default function VoiceConversationPanel({ getCanvasDescription, compact = false }) {
  const speakRef = useRef(null);
  const sendingRef = useRef(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const transcriptEndRef = useRef(null);

  const {
    phase, messages, isLoading, problem, coveredTopics, track,
    sendMessage, voiceEnabled, autoListen, setVoiceEnabled, setAutoListen,
  } = useInterviewStore();

  const trackCfg = getTrack(track);
  const PHASE_CONFIG = trackCfg.phaseConfig;
  const pc = PHASE_CONFIG[phase];

  const latestAI = [...messages].reverse().find((m) => m.role === "assistant");
  const recentExchange = messages.slice(-4);

  // Speech is handled centrally by the effect below — don't speak here.
  const doSend = useCallback(async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;
    setLiveTranscript("");
    setTypedInput("");
    await sendMessage(trimmed, getCanvasDescription?.() || "");
    sendingRef.current = false;
  }, [sendMessage, getCanvasDescription]);

  const {
    isListening, isSpeaking, speak, startListening, stopListening, stopSpeaking,
  } = useVoice({
    onTranscript: (text) => setLiveTranscript(text),
    onFinalResult: (text) => { setLiveTranscript(""); doSend(text); },
    enabled: voiceEnabled,
    autoListen,
  });

  useEffect(() => { speakRef.current = speak; }, [speak]);

  // Central TTS: speak any new assistant message (initial + replies).
  // Uses a last-spoken-index ref so each message speaks exactly once, and
  // survives React StrictMode's double-mount.
  const lastSpokenIdxRef = useRef(-1);
  useEffect(() => {
    if (!voiceEnabled || !speak) return;
    const lastIdx = messages.length - 1;
    if (lastIdx < 0) return;
    const last = messages[lastIdx];
    if (last.role !== "assistant") return;
    if (lastIdx <= lastSpokenIdxRef.current) return;
    lastSpokenIdxRef.current = lastIdx;
    speak(last.content);
  }, [speak, voiceEnabled, messages]);

  useEffect(() => {
    if (showTranscript) transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTranscript]);

  const handleMicToggle = () => {
    if (isListening) { stopListening(); return; }
    stopSpeaking();
    setLiveTranscript("");
    startListening();
  };

  // ── Voice state → UI state ────────────────────────────────────────
  let stateLabel = "Tap to speak";
  let stateColor = "text-gray-400";
  if (isSpeaking) { stateLabel = "Interviewer is speaking…"; stateColor = "text-pink-500"; }
  else if (isListening) { stateLabel = "Listening…"; stateColor = "text-red-500"; }
  else if (isLoading) { stateLabel = "Thinking…"; stateColor = "text-gray-500"; }

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-white to-pink-50/30 dark:from-gray-900 dark:to-pink-950/10">
      {/* Phase bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full" style={{ background: pc.color }} />
        <span className="text-[13px] font-medium" style={{ color: pc.color }}>
          Phase {pc.num}: {pc.label}
        </span>
        {phase === "stories" && problem?.topics?.length > 0 && (
          <span className="text-[11px] text-gray-400">
            · {coveredTopics.length}/{problem.topics.length} behaviors probed
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              showTranscript
                ? "border-gray-400 bg-gray-100 text-gray-700 dark:bg-gray-800"
                : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {showTranscript ? "Hide transcript" : "Show transcript"}
          </button>
        </div>
      </div>

      {/* Main area — either voice stage OR transcript */}
      {showTranscript ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-[14px] rounded-br-[4px]"
                  : "bg-gray-100 dark:bg-gray-800 rounded-[14px] rounded-bl-[4px]"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-1 px-3.5 py-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-gray-400 animate-dot-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          <div ref={transcriptEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0">
          {/* Recent exchange (tiny preview above the current message) */}
          {recentExchange.length > 1 && (
            <div className="px-6 pt-4 pb-2 space-y-1.5 text-[12px] text-gray-400 max-h-[120px] overflow-y-auto">
              {recentExchange.slice(0, -1).map((m, i) => (
                <div key={i} className="line-clamp-2">
                  <span className="font-medium">
                    {m.role === "user" ? "You:" : "Interviewer:"}{" "}
                  </span>
                  {m.content}
                </div>
              ))}
            </div>
          )}

          {/* Current AI message — the center stage */}
          <div className={`flex-1 flex flex-col items-center justify-center px-6 ${compact ? "py-4" : "py-8"}`}>
            {latestAI ? (
              <div className={`max-w-2xl w-full text-center mb-8 ${compact ? "text-base" : "text-[19px]"} leading-relaxed text-gray-900 dark:text-gray-100 whitespace-pre-wrap`}>
                {latestAI.content}
              </div>
            ) : (
              <div className="text-gray-400 text-sm mb-8">Your interviewer will start speaking shortly…</div>
            )}

            {/* Mic button */}
            <button
              onClick={handleMicToggle}
              disabled={!voiceEnabled || isLoading}
              className={`relative ${compact ? "w-16 h-16" : "w-24 h-24"} rounded-full flex items-center justify-center text-white text-3xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? "bg-red-500 ring-8 ring-red-500/30 scale-110"
                  : isSpeaking
                  ? "bg-pink-500 ring-8 ring-pink-500/30 animate-pulse"
                  : "bg-pink-500 hover:bg-pink-600 hover:scale-105"
              }`}
              title={isListening ? "Stop listening" : "Tap to speak"}
            >
              <span className="text-2xl">🎤</span>
              {isListening && (
                <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
              )}
            </button>

            {/* State label */}
            <div className={`mt-4 text-sm font-medium ${stateColor}`}>
              {stateLabel}
            </div>

            {/* Live transcription */}
            {liveTranscript && (
              <div className="mt-4 max-w-xl w-full text-center text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2">
                {liveTranscript}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer — voice controls + keyboard fallback */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs flex-shrink-0">
        <button
          onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) { stopSpeaking(); stopListening(); } }}
          className={`px-2.5 py-1 rounded-md border transition-colors ${
            voiceEnabled
              ? "border-green-200 bg-green-50 text-green-600 dark:bg-green-500/10 dark:border-green-500/30"
              : "border-gray-200 dark:border-gray-700 text-gray-400"
          }`}
        >
          {voiceEnabled ? "🔊 Voice on" : "🔇 Voice off"}
        </button>
        {voiceEnabled && (
          <button
            onClick={() => setAutoListen(!autoListen)}
            className={`px-2.5 py-1 rounded-md border transition-colors ${
              autoListen
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30"
                : "border-gray-200 dark:border-gray-700 text-gray-400"
            }`}
          >
            {autoListen ? "Auto-listen on" : "Auto-listen off"}
          </button>
        )}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 text-red-500 dark:bg-red-500/10"
          >
            Stop speaking
          </button>
        )}

        <div className="flex-1" />

        {/* Keyboard fallback */}
        <button
          onClick={() => setKeyboardMode((v) => !v)}
          className="px-2.5 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          title="Fallback keyboard input"
        >
          {keyboardMode ? "Hide keyboard" : "⌨ Use keyboard"}
        </button>
      </div>

      {keyboardMode && (
        <div className="px-4 pb-3 flex gap-2 border-t border-gray-100 dark:border-gray-800 pt-3 flex-shrink-0">
          <input
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && typedInput.trim() && !isLoading) {
                doSend(typedInput);
              }
            }}
            placeholder="Type instead of speaking (press Enter to send)…"
            className="flex-1 px-3.5 py-2 rounded-lg text-sm outline-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          />
          <button
            onClick={() => typedInput.trim() && !isLoading && doSend(typedInput)}
            disabled={isLoading || !typedInput.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-pink-500 hover:bg-pink-600 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
