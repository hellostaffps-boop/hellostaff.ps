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

    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const jwt = authHeader.replace("Bearer ", "");

    const { data: { user }, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "platform_admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const SUPER_ADMIN_EMAIL = Deno.env.get("SUPER_ADMIN_EMAIL");
    if (SUPER_ADMIN_EMAIL && user.email !== SUPER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Forbidden: Only super admin can bootstrap" }), { status: 403, headers: corsHeaders });
    }

    if (profile.role === "platform_admin") {
      return new Response(JSON.stringify({ success: true, alreadyAdmin: true }), { headers: corsHeaders });
    }

    await supabase.from("profiles").update({ role: "platform_admin" }).eq("id", user.id);
    await supabase.from("audit_logs").insert({ action: "admin_bootstrap", actor_uid: user.id, actor_email: user.email, target_type: "user", target_id: user.id, status: "success" });

    return new Response(JSON.stringify({ success: true, message: "Admin access granted" }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
