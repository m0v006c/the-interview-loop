import { useEffect } from "react";
import { useInterviewStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import DashboardShell from "@/components/DashboardShell";
import SignInModal from "@/components/SignInModal";
import LandingScreen from "@/pages/LandingScreen";
import HomeScreen from "@/pages/HomeScreen";
import HistoryScreen from "@/pages/HistoryScreen";
import InProgressScreen from "@/pages/InProgressScreen";
import InterviewScreen from "@/pages/InterviewScreen";
import BehavioralInterviewScreen from "@/pages/BehavioralInterviewScreen";
import NotepadInterviewScreen from "@/pages/NotepadInterviewScreen";
import ScoringScreen from "@/pages/ScoringScreen";

export default function App() {
  const screen = useInterviewStore((s) => s.screen);
  const track = useInterviewStore((s) => s.track);
  const init = useAuthStore((s) => s.init);
  const loading = useAuthStore((s) => s.loading);

  // Subscribe to session / auth events once
  useEffect(() => { init(); }, [init]);

  // Pre-warm speechSynthesis on app mount so premium voices (Google/Daniel/Samantha)
  // are ready before the user starts their first interview session.
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    // First call triggers async loading; second call inside voiceschanged
    // ensures we capture the full list including enhanced voices.
    window.speechSynthesis.getVoices();
    const onReady = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", onReady, { once: true });
    return () => window.speechSynthesis.removeEventListener("voiceschanged", onReady);
  }, []);

  // Show a brief spinner only while the initial session check runs
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-gray-200 dark:border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Interview and scoring are focus-mode — no dashboard shell
  const content = (() => {
    if (screen === "interview") {
      if (track === "behavioral") return <BehavioralInterviewScreen />;
      if (track === "problem_solving" || track === "low_level_design") return <NotepadInterviewScreen />;
      return <InterviewScreen />;
    }
    if (screen === "scoring") return <ScoringScreen />;
    return (
      <DashboardShell>
        {screen === "home"        ? <HomeScreen /> :
         screen === "history"     ? <HistoryScreen /> :
         screen === "in_progress" ? <InProgressScreen /> :
                                    <LandingScreen />}
      </DashboardShell>
    );
  })();

  return (
    <>
      {content}
      <SignInModal />
    </>
  );
}
