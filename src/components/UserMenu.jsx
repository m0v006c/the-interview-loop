import { useState, useRef, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/authStore";

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const [imgError, setImgError] = useState(false);
  const meta = user.user_metadata || {};
  const displayName = meta.full_name || meta.name || meta.user_name || user.email || "You";
  const avatarUrl = !imgError ? (meta.avatar_url || meta.picture) : null;
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700 text-sm hover:opacity-90"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-amber-400 grid place-items-center text-[11px] text-white font-bold flex-shrink-0">
            {initial}
          </div>
        )}
        <span className="font-medium truncate max-w-[140px]">{displayName}</span>
        <span className="text-gray-400 text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="text-sm font-medium truncate">{displayName}</div>
            {user.email && <div className="text-xs text-gray-500 truncate">{user.email}</div>}
          </div>
          {import.meta.env.VITE_ENABLE_TOP_NAV_EXTRAS === "true" && (
            <>
              <button disabled className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2">
                <span>📊</span> Progress
                <span className="ml-auto text-[10px]">soon</span>
              </button>
              <button disabled className="w-full text-left px-4 py-2 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2">
                <span>⚙️</span> Settings
                <span className="ml-auto text-[10px]">soon</span>
              </button>
            </>
          )}
          <div className="border-t border-gray-100 dark:border-gray-800 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
            >
              <span>🚪</span> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
