import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) console.error("[supabaseClient] VITE_SUPABASE_URL is missing.");
if (!supabaseAnonKey) console.error("[supabaseClient] VITE_SUPABASE_PUBLISHABLE_KEY is missing.");

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const getSupabase = () => supabase;