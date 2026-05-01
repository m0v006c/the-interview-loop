import { useState, useRef, useCallback, useEffect } from "react";

/**
 * useVoice — full duplex voice hook
 *
 * onTranscript(text)    → called with interim + final text as user speaks (for live input preview)
 * onFinalResult(text)   → called ONCE when recognition ends with the final transcript (for auto-send)
 */
export function useVoice({ onTranscript, onFinalResult, enabled = true, autoListen = true }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const onFinalResultRef = useRef(onFinalResult);
  const synthRef = useRef(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );

  // Keep the callback ref fresh so the recognition closure always calls the latest version
  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  // ─── Text-to-Speech (interviewer speaks) ─────────────────────────
  const speak = useCallback(
    (text) => {
      if (!enabled || !synthRef.current || !text) return;

      const synth = synthRef.current;
      synth.cancel();

      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.volume = 1.0;
        utterance.lang = "en-US";

        const voices = synth.getVoices();
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Google") ||
                v.name.includes("Samantha") ||
                v.name.includes("Daniel") ||
                v.name.includes("Natural"))
          ) || voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          if (autoListen && enabled) startListening();
        };
        utterance.onerror = (e) => {
          if (e?.error && e.error !== "canceled" && e.error !== "interrupted") {
            console.warn("speechSynthesis error:", e.error);
          }
          setIsSpeaking(false);
        };

        synth.speak(utterance);
      };

      // Wait until a preferred voice (Google / Samantha / Daniel / Natural) is
      // available. On first page load Chrome may return a short list of basic
      // voices before the enhanced ones finish loading — checking length > 0
      // is not enough; we must verify a preferred voice is actually present.
      const hasPreferred = (list) =>
        list.some(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Google") ||
              v.name.includes("Samantha") ||
              v.name.includes("Daniel") ||
              v.name.includes("Natural"))
        );
      if (!hasPreferred(synth.getVoices())) {
        let fired = false;
        const fireOnce = () => {
          if (fired) return;
          fired = true;
          synth.removeEventListener("voiceschanged", fireOnce);
          doSpeak();
        };
        synth.addEventListener("voiceschanged", fireOnce);
        setTimeout(fireOnce, 800);
      } else {
        doSpeak();
      }
    },
    [enabled, autoListen] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ─── Speech-to-Text (candidate speaks) ──────────────────────────
  const startListening = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    )
      return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";
    let silenceTimer = null;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      // Update the input field with live preview
      const full = finalTranscript + interim;
      if (onTranscript) onTranscript(full);

      // Auto-stop after 2s of silence once we have final results
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (finalTranscript.trim()) {
          recognition.stop();
        }
      }, 2000);
    };

    recognition.onstart = () => setIsListening(true);

    recognition.onend = () => {
      setIsListening(false);
      const text = finalTranscript.trim();
      if (text) {
        // Fire the final result callback — ChatPanel uses this to auto-send
        if (onFinalResultRef.current) {
          onFinalResultRef.current(text);
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        console.error("Speech recognition error:", e.error);
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      // Note: NOT calling stopSpeaking() here — React StrictMode simulates an
      // unmount+remount in dev which would cancel the very utterance we just
      // queued. Call stopSpeaking explicitly (via prop/store) when navigating.
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isListening,
    isSpeaking,
    speak,
    startListening,
    stopListening,
    stopSpeaking,
  };
}
