import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] MISSING ENV VARS — VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not set.\n" +
    `URL: ${supabaseUrl || '(missing)'}\nKey: ${supabaseAnonKey ? supabaseAnonKey.slice(0, 20) + '...' : '(missing)'}`
  );
}

if (supabaseAnonKey && !supabaseAnonKey.startsWith("eyJ")) {
  console.error(
    "[Supabase] INVALID ANON KEY — The key does not look like a Supabase JWT token (should start with 'eyJ').\n" +
    "You may have set a Base44 publishable key instead of the Supabase anon key.\n" +
    "Go to your Supabase project → Settings → API → anon/public key."
  );
}

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