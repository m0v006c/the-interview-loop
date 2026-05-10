import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProfile } from "@/lib/db";
import { loadNotifications } from "@/lib/notificationStorage";

/**
 * Auth Store — tracks Supabase session, user, and plan profile.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,   // full profile row including plan, usage counters
  loading: true,
  configured: isSupabaseConfigured,
  signInOpen: false,

  openSignIn: () => set({ signInOpen: true }),
  closeSignIn: () => set({ signInOpen: false }),

  /** Load profile (plan + usage) for the given user. */
  loadProfile: async (userId) => {
    if (!userId) return;
    const profile = await getProfile(userId);
    if (profile) set({ profile });
  },

  /** Restore persisted notifications for this user into the interview store. */
  restoreNotifications: async (userId) => {
    const saved = loadNotifications(userId);
    if (!saved.length) return;
    // Dynamic import avoids circular dependency (store → authStore → store)
    const { useInterviewStore } = await import("@/lib/store");
    useInterviewStore.getState().setFeedbackNotifications(saved);
  },

  /** Refresh profile from DB (call after plan change or usage increment). */
  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;
    const profile = await getProfile(user.id);
    if (profile) set({ profile });
  },

  init: async () => {
    if (!supabase) {
      set({ loading: false });
      return;
    }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    set({ user, loading: false });
    if (user) {
      get().loadProfile(user.id);
      get().restoreNotifications(user.id);
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      set((s) => ({
        user: nextUser,
        profile: nextUser ? s.profile : null,
        signInOpen: nextUser ? false : s.signInOpen,
      }));
      if (nextUser) {
        get().loadProfile(nextUser.id);
        get().restoreNotifications(nextUser.id);
      }
    });
  },

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
    set({ user: null, profile: null });
    // Clear in-memory notifications; localStorage copy persists for next login
    const { useInterviewStore } = await import("@/lib/store");
    useInterviewStore.getState().setFeedbackNotifications([]);
  },
}));
