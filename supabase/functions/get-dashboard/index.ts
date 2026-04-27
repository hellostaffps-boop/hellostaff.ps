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
    if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: corsHeaders });

    const role = profile.role;

    let stats = {};

    if (role === "platform_admin") {
      const { count: users } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: jobs } = await supabase.from("jobs").select("*", { count: "exact", head: true });
      const { count: orgs } = await supabase.from("organizations").select("*", { count: "exact", head: true });
      const { count: apps } = await supabase.from("applications").select("*", { count: "exact", head: true });
      stats = { users: users || 0, jobs: jobs || 0, organizations: orgs || 0, applications: apps || 0 };
    } else if (role === "candidate") {
      const { count: savedJobs } = await supabase.from("saved_jobs").select("*", { count: "exact", head: true }).eq("candidate_id", user.id);
      const { count: applications } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("candidate_email", user.email);
      stats = { savedJobs: savedJobs || 0, applications: applications || 0 };
    } else if (role === "employer_owner" || role === "employer_manager") {
      const { data: empProfile } = await supabase.from("employer_profiles").select("organization_id").eq("id", user.id).single();
      const orgId = empProfile?.organization_id;
      if (orgId) {
        const { count: jobs } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("organization_id", orgId);
        const { count: apps } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("organization_id", orgId);
        stats = { jobs: jobs || 0, applications: apps || 0 };
      }
    }

    return new Response(JSON.stringify({ role, stats }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
