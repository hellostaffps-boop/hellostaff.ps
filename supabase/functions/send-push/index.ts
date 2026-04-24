import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webPush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Configure Web Push with VAPID keys
// The keys should be stored in Edge Function secrets:
// supabase secrets set VAPID_PUBLIC_KEY=...
// supabase secrets set VAPID_PRIVATE_KEY=...
// supabase secrets set VAPID_SUBJECT="mailto:support@hellostaff.ps"

const PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "BEfDH9JxK_6JHOJYrF9mij6IGdK9PND-JwN4vr3Jn2-YOetDpWq603Ai2_3zHbsT9EUE1pZaIVnuZL-vv4MbODs";
const PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY"); // User must set this!
const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:support@hellostaff.ps";

webPush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } }
    });

    const { user_id, title, body, data } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id is required" }), { status: 400, headers: corsHeaders });
    }

    // Retrieve target user profile
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("push_subscription")
      .eq("id", user_id)
      .single();

    if (error || !profile?.push_subscription) {
      return new Response(JSON.stringify({ error: "User has no push subscription" }), { status: 400, headers: corsHeaders });
    }

    const subscription = profile.push_subscription;
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
