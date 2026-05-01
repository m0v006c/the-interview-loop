import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Don't throw — let the app boot and the UI show a "not configured" state.
  console.warn(
    "[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. " +
      "Add them to .env and restart the dev server to enable sign-in."
  );
}

export const supabase = url && anon ? createClient(url, anon) : null;

export const isSupabaseConfigured = Boolean(supabase);
