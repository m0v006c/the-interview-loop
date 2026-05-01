import { useEffect } from "react";
import { useAuthStore } from "@/lib/authStore";

export default function SignInModal() {
  const { signInOpen, closeSignIn, signIn, configured } = useAuthStore();

  // Close on ESC
  useEffect(() => {
    if (!signInOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closeSignIn(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signInOpen, closeSignIn]);

  if (!signInOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-5"
      onClick={closeSignIn}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={closeSignIn}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Close"
        >
          ✕
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
            IL
          </div>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wider text-gray-400">The</div>
            <div className="font-semibold tracking-tight text-sm -mt-0.5">Interview Loop</div>
          </div>
        </div>

        <div className="mb-5">
          <h1 className="text-lg font-semibold tracking-tight mb-1">Sign in to continue</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Sign in to save your progress, resume sessions, and see your skill breakdown.
            New here? Your account is created automatically on first sign-in.
          </p>
        </div>

        {!configured ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-[13px] text-amber-800 dark:text-amber-300 leading-relaxed">
            <div className="font-semibold mb-1">Sign-in not configured yet</div>
            Add <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-500/20 rounded text-[11px]">VITE_SUPABASE_URL</code>{" "}
            and <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-500/20 rounded text-[11px]">VITE_SUPABASE_ANON_KEY</code>{" "}
            to your .env and restart the dev server.
          </div>
        ) : (
          <div className="space-y-2.5">
            <button
              onClick={() => signIn("google")}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            <button
              onClick={() => signIn("github")}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl bg-gray-900 text-white hover:bg-gray-800 text-sm font-medium transition-colors"
            >
              <GitHubIcon />
              <span>Continue with GitHub</span>
            </button>
            <button
              disabled
              title="LinkedIn sign-in coming soon"
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-400 cursor-not-allowed"
            >
              <LinkedInIcon />
              <span>Continue with LinkedIn</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-medium">soon</span>
            </button>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400 text-center leading-relaxed">
          By signing in you agree to our Terms and acknowledge our Privacy Policy.
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.7 7.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2.1 1.4-4.6 2.2-7.2 2.2-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 40.6 16.3 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.53.12-3.19 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.19.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.29 0 .32.22.7.83.58C20.56 22.3 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.32V9h3.42v1.56h.05c.48-.9 1.64-1.86 3.38-1.86 3.61 0 4.28 2.38 4.28 5.47v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
    </svg>
  );
}
