import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error("[supabaseClient] VITE_SUPABASE_URL is missing. Set it in Base44 App Secrets.");
}
if (!supabaseAnonKey) {
  console.error("[supabaseClient] VITE_SUPABASE_PUBLISHABLE_KEY is missing. Set it in Base44 App Secrets.");
}
if (supabaseAnonKey && !supabaseAnonKey.startsWith("eyJ")) {
  console.error("[supabaseClient] Key does not look like a Supabase JWT (should start with 'eyJ'). Check Supabase project → Settings → API → anon/public key.");
}

let _client = null;

export const getSupabase = () => {
  if (!_client) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        `Supabase is not configured. Missing: ${!supabaseUrl ? "VITE_SUPABASE_URL" : ""} ${!supabaseAnonKey ? "VITE_SUPABASE_PUBLISHABLE_KEY" : ""}.`.trim()
      );
    }
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

export const supabase = new Proxy({}, {
  get(_, prop) {
    return getSupabase()[prop];
  },
});