import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webPush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// SECURITY FIX (2026-04-27):
// 1. Removed hardcoded VAPID_PUBLIC_KEY fallback
// 2. Added auth.uid() verification (server-side truth)
// 3. Restricted CORS to production origin only

const PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@staffps.com";

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in Edge Function secrets");
}

webPush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

// SECURITY: Restrict CORS to production domains
// Supports multiple origins separated by comma (e.g. "https://www.staffps.com,https://staffps.com")
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") || "https://www.staffps.com")
  .split(",")
  .map(o => o.trim())
  .filter(o => o.length > 0);

function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : ALLOWED_ORIGINS[0] || "https://www.staffps.com";

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } }
    });

    // SECURITY FIX: Verify the caller's identity server-side
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const { user_id, title, body, data } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // SECURITY FIX: Users can only send push notifications to themselves
    // Only platform_admin can send to other users
    if (user.id !== user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (profile?.role !== "platform_admin") {
        return new Response(JSON.stringify({ error: "Forbidden: You can only send notifications to yourself" }), { 
          status: 403, 
          headers: corsHeaders 
        });
      }
    }

    // Retrieve target user profile
    const { data: targetProfile, error } = await supabase
      .from("profiles")
      .select("push_subscription")
      .eq("id", user_id)
      .single();

    if (error || !targetProfile?.push_subscription) {
      return new Response(JSON.stringify({ error: "User has no push subscription" }), { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const subscription = targetProfile.push_subscription;
    const payload = JSON.stringify({
      title: title || "New Notification - Hello Staff",
      body: body || "You have a new update.",
      icon: "/favicon.svg",
      data: data || { url: "/" }
    });

    // Send the notification
    const response = await webPush.sendNotification(subscription, payload);

    return new Response(JSON.stringify({ success: true, pushResult: response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Push Error", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
