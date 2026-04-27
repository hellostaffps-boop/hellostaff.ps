import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const jwt = authHeader.replace("Bearer ", "");

    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Check if profile exists
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (profile) {
      return new Response(JSON.stringify({
        exists: true,
        id: profile.id,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        needsSetup: !profile.role,
      }), { headers: corsHeaders });
    }

    // Profile doesn't exist — create it (trigger failed, create manually)
    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
    const { data: newProfile, error: createErr } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: displayName,
        role: null,
        preferred_language: "ar",
        status: "active",
      })
      .select()
      .single();

    if (createErr) throw createErr;

    return new Response(JSON.stringify({
      exists: true,
      id: newProfile.id,
      email: newProfile.email,
      role: newProfile.role,
      status: newProfile.status,
      needsSetup: true,
      created: true,
    }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
