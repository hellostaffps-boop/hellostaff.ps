/**
 * jobService.js — Job CRUD and smart matching Supabase operations.
 */
import { supabase } from "@/lib/supabaseClient";
import { getEmployerProfile } from "@/lib/services/profileService";
import { getOwnedOrganization, getOrganization } from "@/lib/services/organizationService";
import { createNotification } from "@/lib/services/notificationService";

export const getPublishedJobs = async (filters = {}) => {
  let query = supabase
    .from("jobs")
    .select(`
      *,
      organizations (
        id,
        name,
        logo_url,
        subscriptions (
          plan,
          status,
          expires_at
        )
      )
    `)
    .eq("status", "published");

  if (filters.job_type) query = query.eq("job_type", filters.job_type);
  if (filters.employment_type) query = query.eq("employment_type", filters.employment_type);
  if (filters.location) query = query.ilike("location", `%${filters.location}%`);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;

  const now = new Date();
  return (data || []).map((job) => {
    const activeSub = job.organizations?.subscriptions?.find((s) =>
      s.status === "active" && new Date(s.expires_at) > now && (s.plan === "premium" || s.plan === "annual")
    );
    return {
      ...job,
      is_featured: !!activeSub,
      is_verified: !!job.organizations?.subscriptions?.find(
        (s) => s.status === "active" && new Date(s.expires_at) > now
      ),
    };
  });
};

export const getEmployerOrganizationJobs = async (userEmail) => {
  const profile = await getEmployerProfile(userEmail);
  if (!profile?.organization_id) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getJob = async (jobId) => {
  if (!jobId) return null;
  const { data, error } = await supabase
    .from("jobs")
    .select("*, organizations(*)")
    .eq("id", jobId)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getJob]", error);
  return data || null;
};

export const getJobsByOrg = async (orgId) => {
  if (!orgId) return [];
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createJobForOwnedOrganization = async (userEmail, data) => {
  const org = await getOwnedOrganization(userEmail);
  if (!org) throw new Error("No organization found for this employer");

  const ALLOWED = ["title", "description", "requirements", "benefits", "job_type",
    "employment_type", "location", "salary_min", "salary_max", "salary_period",
    "experience_required", "status"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  if (!["draft", "published"].includes(safe.status)) safe.status = "draft";

  const { data: created, error } = await supabase
    .from("jobs")
    .insert({ ...safe, organization_id: org.id, organization_name: org.name, posted_by: userEmail })
    .select()
    .single();
  if (error) throw error;

  try { await notifyMatchingCandidatesForJob(created); } catch (_) {}

  return created;
};

export const updateJobForOwnedOrganization = async (userEmail, jobId, data) => {
  const profile = await getEmployerProfile(userEmail);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const job = await getJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.organization_id !== profile.organization_id) throw new Error("FORBIDDEN");

  const ALLOWED = ["title", "description", "requirements", "benefits", "job_type",
    "employment_type", "location", "salary_min", "salary_max", "salary_period",
    "experience_required", "status"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  safe.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("jobs").update(safe).eq("id", jobId).select().single();
  if (error) throw error;
  return updated;
};

export const updateJob = async (jobId, data) => {
  const { data: updated, error } = await supabase
    .from("jobs").update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", jobId).select().single();
  if (error) throw error;
  return updated;
};

export const deleteJob = async (jobId) => {
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw error;
};

export const getRelatedJobs = async (jobId, jobType) => {
  const { data, error } = await supabase
    .from("jobs").select("*").eq("status", "published").eq("job_type", jobType)
    .neq("id", jobId).order("created_at", { ascending: false }).limit(4);
  if (error) throw error;
  return data || [];
};

export const getRecentlyPostedJobs = async (count = 5) => {
  const { data, error } = await supabase
    .from("jobs").select("*").eq("status", "published")
    .order("created_at", { ascending: false }).limit(count);
  if (error) throw error;
  return data || [];
};

export const getJobCountsByType = async () => {
  const { data, error } = await supabase
    .from("jobs")
    .select("job_type")
    .eq("status", "published");

  if (error) throw error;
  
  const counts = {};
  (data || []).forEach(j => {
    if (j.job_type) counts[j.job_type] = (counts[j.job_type] || 0) + 1;
  });
  return counts;
};

// ─── Smart Matching (optimised — no full-table scan) ──────────────────────────
export const notifyMatchingCandidatesForJob = async (job) => {
  if (!job?.job_type || !job?.id) return;
  try {
    // Delegate matching logic to a SECURITY DEFINER RPC to avoid N-scan from client
    await supabase.rpc("notify_matching_candidates_for_job", { p_job_id: job.id });
  } catch (err) {
    // Fallback: best-effort client-side matching (kept for resilience)
    console.warn("[notifyMatchingCandidatesForJob] RPC failed, attempting client-side fallback:", err.message);
    await _clientSideMatchingFallback(job);
  }
};

const _getMatchingJobTypes = (type) => {
  const map = {
    barista: ["barista", "waiter", "cashier"],
    chef: ["chef", "kitchen_helper", "pastry_chef", "bakery"],
    cashier: ["cashier", "barista", "waiter"],
    waiter: ["waiter", "host", "barista", "cashier"],
    host: ["host", "waiter", "cashier"],
    kitchen_helper: ["kitchen_helper", "chef", "cleaner"],
    restaurant_manager: ["restaurant_manager"],
  };
  return map[type] || [type];
};

const _clientSideMatchingFallback = async (job) => {
  try {
    let candidatesToNotify = [];

    if (job.job_type === "cleaner") {
      const { data: allCandidates } = await supabase
        .from("candidate_profiles").select("user_email, job_types");
      candidatesToNotify = (allCandidates || []).filter((c) => {
        const types = c.job_types || [];
        return !types.some((t) => ["chef", "kitchen_helper", "restaurant_manager"].includes(t));
      });
    } else {
      let matchingTypes = _getMatchingJobTypes(job.job_type);
      const fullText = `${job.title} ${job.description || ""}`.toLowerCase();
      if (fullText.includes("قهوة") || fullText.includes("coffee")) matchingTypes.push("barista");
      if (fullText.includes("تنظيف") || fullText.includes("clean")) matchingTypes.push("cleaner");
      if (fullText.includes("كاش") || fullText.includes("cash")) matchingTypes.push("cashier");
      matchingTypes = [...new Set(matchingTypes)];

      const { data: candidates } = await supabase
        .from("candidate_profiles").select("user_email, job_types")
        .overlaps("job_types", matchingTypes);
      candidatesToNotify = candidates || [];
    }

    await Promise.allSettled(
      candidatesToNotify.map((c) =>
        createNotification({
          userEmail: c.user_email,
          title: `تم نشر وظيفة جديدة من قبل ${job.organization_name || "شركة"}`,
          message: `وظيفة جديدة تناسبك: ${job.title}`,
          type: "job",
          link: `/jobs/${job.id}`,
        })
      )
    );
  } catch (_) {}
};
