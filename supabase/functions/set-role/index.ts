import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = ["candidate", "employer_owner"];

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

    const body = await req.json();
    const { role } = body;

    // Validate role
    if (!ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}` }), { status: 400, headers: corsHeaders });
    }

    // Check current profile
    const { data: profile } = await supabase.from("profiles").select("role, email").eq("id", user.id).single();

    // SECURITY: Do not allow role change if already set
    if (profile?.role) {
      return new Response(JSON.stringify({ error: "Role already set. Contact support to change." }), { status: 403, headers: corsHeaders });
    }

    // Update profile role
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateErr) throw updateErr;

    // Create sub-profile based on role
    if (role === "candidate") {
      const { error: subErr } = await supabase.from("candidate_profiles").insert({
        id: user.id,
        user_email: user.email,
        full_name: user.user_metadata?.full_name || "",
      });
      if (subErr) console.error("[set-role] Failed to create candidate profile:", subErr);
    } else if (role === "employer_owner") {
      const { error: subErr } = await supabase.from("employer_profiles").insert({
        id: user.id,
        user_email: user.email,
        full_name: user.user_metadata?.full_name || "",
        organization_id: null,
        is_owner: true,
      });
      if (subErr) console.error("[set-role] Failed to create employer profile:", subErr);
    }

    return new Response(JSON.stringify({ success: true, role }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
