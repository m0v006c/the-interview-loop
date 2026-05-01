import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Auth Store — tracks Supabase session and user.
 *
 * On app boot: read current session, subscribe to auth changes.
 * Exposes signIn (OAuth redirect) and signOut.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  loading: true, // true while we're checking the initial session
  configured: isSupabaseConfigured,
  signInOpen: false, // sign-in modal visibility

  openSignIn: () => set({ signInOpen: true }),
  closeSignIn: () => set({ signInOpen: false }),

  /** Called once on app mount to load the current session. */
  init: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }
    const { data } = await supabase.auth.getSession();
    set({ user: data.session?.user ?? null, loading: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      set((s) => ({
        user: nextUser,
        // If the modal was open, close it now that we have a user
        signInOpen: nextUser ? false : s.signInOpen,
      }));
    });
  },

  /** Kicks off an OAuth redirect for the given provider (e.g. 'google', 'github'). */
  signIn: async (provider) => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
