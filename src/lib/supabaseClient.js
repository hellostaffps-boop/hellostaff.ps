import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://djmolexscnrzbwvuziaq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_NiNMXKHeNne1K76PzC0j3Q_lepGr";

let _client = null;

export const getSupabase = () => {
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
};

// Backwards-compatible named export (lazy proxy)
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  },
});