import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMITS = {
  "auth": { max: 5, window: 60 },       // 5 requests per 60 seconds
  "api": { max: 100, window: 60 },     // 100 requests per 60 seconds
  "upload": { max: 10, window: 60 },  // 10 uploads per 60 seconds
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, userId, ip } = body;
    const limit = RATE_LIMITS[action] || RATE_LIMITS["api"];

    const key = `rate_limit:${action}:${userId || ip}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - limit.window;

    // Clean old entries and insert new one
    await supabase.from("rate_limit_logs").delete().lt("timestamp", new Date(windowStart * 1000).toISOString());
    await supabase.from("rate_limit_logs").insert({ key, timestamp: new Date().toISOString(), action });

    // Count requests in window
    const { count } = await supabase.from("rate_limit_logs").select("*", { count: "exact", head: true }).eq("key", key);

    const allowed = (count || 0) <= limit.max;
    const remaining = Math.max(0, limit.max - (count || 0));

    return new Response(JSON.stringify({ allowed, remaining, limit: limit.max, window: limit.window }), {
      headers: corsHeaders,
      status: allowed ? 200 : 429,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, allowed: true }), { status: 500, headers: corsHeaders });
  }
});
