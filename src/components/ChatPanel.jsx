import { useState, useRef, useEffect, useCallback } from "react";
import { useInterviewStore } from "@/lib/store";
import { useVoice } from "@/hooks/useVoice";
import { getTrack } from "@/data/tracks";
import MicButton from "./MicButton";

const PLACEHOLDER_BY_TRACK = {
  system_design: "Type your response or question...",
  behavioral: "Share your story or answer the question...",
};

// Phases where we show the "topics covered" counter
const TOPICS_PHASE_BY_TRACK = {
  system_design: "deep_dive",
  behavioral: "stories",
};

export default function ChatPanel({ getCanvasDescription }) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const sendingRef = useRef(false);
  const speakRef = useRef(null);

  const {
    phase, messages, isLoading, problem, coveredTopics, track,
    sendMessage, voiceEnabled, autoListen, setVoiceEnabled, setAutoListen,
  } = useInterviewStore();

  const trackCfg = getTrack(track);
  const PHASE_CONFIG = trackCfg.phaseConfig;
  const topicsPhase = TOPICS_PHASE_BY_TRACK[track] || "deep_dive";
  const placeholder = PLACEHOLDER_BY_TRACK[track] || "Type your response...";

  // Direct send: takes text explicitly, bypasses React state timing.
  // Speech is handled centrally by the effect below (watches messages),
  // so we don't call speak() here.
  const doSend = useCallback(async (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;
    setInput("");
    await sendMessage(trimmed, getCanvasDescription?.() || "");
    sendingRef.current = false;
  }, [sendMessage, getCanvasDescription]);

  const {
    isListening, isSpeaking, speak, startListening, stopListening, stopSpeaking,
  } = useVoice({
    onTranscript: (text) => setInput(text),
    onFinalResult: (text) => {
      setInput("");
      doSend(text);
    },
    enabled: voiceEnabled,
    autoListen,
  });

  // Keep speak ref current
  useEffect(() => { speakRef.current = speak; }, [speak]);

  const pc = PHASE_CONFIG[phase];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Central TTS: speak any NEW assistant message (initial greeting + every reply).
  // Uses a last-spoken-index ref so each message speaks exactly once, and
  // survives React StrictMode's simulated mount → unmount → remount cycle.
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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    stopListening();
    doSend(input);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Phase indicator */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{ background: pc.color }} />
        <span className="text-[13px] font-medium" style={{ color: pc.color }}>
          Phase {pc.num}: {pc.label}
        </span>
        {phase === topicsPhase && problem && problem.topics?.length > 0 && (
          <span className="ml-auto text-[11px] text-gray-400">
            {coveredTopics.length}/{problem.topics.length} {track === "behavioral" ? "behaviors" : "topics"}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-500 text-white rounded-[14px] rounded-br-[4px]"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-[14px] rounded-bl-[4px]"
              }`}
            >
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
        <div ref={chatEndRef} />
      </div>

      {/* Voice controls + input */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        {/* Voice controls row */}
        <div className="flex items-center gap-2 mb-2 text-xs">
          <button
            onClick={() => { setVoiceEnabled(!voiceEnabled); if (voiceEnabled) { stopSpeaking(); stopListening(); } }}
            className={`px-2.5 py-1 rounded-xl border transition-colors ${
              voiceEnabled
                ? "border-green-200 bg-green-50 text-green-600 dark:bg-green-500/10 dark:border-green-500/30"
                : "border-gray-200 dark:border-gray-700 text-gray-400"
            }`}
          >
            {voiceEnabled ? "Voice on" : "Voice off"}
          </button>
          {voiceEnabled && (
            <button
              onClick={() => setAutoListen(!autoListen)}
              className={`px-2.5 py-1 rounded-xl border transition-colors ${
                autoListen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/30"
                  : "border-gray-200 dark:border-gray-700 text-gray-400"
              }`}
            >
              {autoListen ? "Auto-listen on" : "Auto-listen off"}
            </button>
          )}
          {isSpeaking && (
            <button onClick={stopSpeaking}
              className="px-2.5 py-1 rounded-xl border border-red-200 bg-red-50 text-red-500 ml-auto dark:bg-red-500/10">
              Stop speaking
            </button>
          )}
          {isListening && (
            <div className="ml-auto flex items-center gap-1 text-red-500">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>Listening...</span>
            </div>
          )}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          {voiceEnabled && (
            <MicButton
              isListening={isListening}
              disabled={isLoading}
              onToggle={() => {
                if (isListening) {
                  stopListening();
                } else {
                  stopSpeaking();
                  setInput("");
                  startListening();
                }
              }}
            />
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
            placeholder={isListening ? "Listening... speak now" : placeholder}
            className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors ${
              isListening ? "border-2 border-red-400" : "border border-gray-200 dark:border-gray-700"
            }`}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: pc.color }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
