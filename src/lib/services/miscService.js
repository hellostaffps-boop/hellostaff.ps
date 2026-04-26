/**
 * miscService.js — Audit logs, top rated employees, testimonials.
 */
import { supabase } from "@/lib/supabaseClient";

export const createAuditLog = async ({ actorEmail, action, targetType, targetId, details = {}, status = "success" }) => {
  const { error } = await supabase.from("audit_logs").insert({
    actor_email: actorEmail,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
    status,
  });
  if (error) console.error("[createAuditLog]", error);
};

export const getTopRatedEmployees = async (limitCount = 5) => {
  const { data, error } = await supabase.rpc("get_top_rated_candidates", { limit_count: limitCount });
  if (error) {
    console.error("[getTopRatedEmployees]", error);
    return [];
  }
  return data || [];
};

export const getPlatformTestimonials = async () => {
  const { data, error } = await supabase
    .from("platform_testimonials")
    .select(`id, quote, rating, profiles(full_name, role)`)
    .order("created_at", { ascending: false });
  if (error) {
    if (error.code !== "42P01") console.error("[getPlatformTestimonials]", error);
    return [];
  }
  return data || [];
};

// ─── Store Orders (user-facing) ───────────────────────────────────────────────

export const getMyOrders = async (userEmail) => {
  if (!userEmail) return [];
  const { data, error } = await supabase
    .from("store_orders")
    .select(`
      *,
      items:store_order_items (
        *,
        product:store_products (id, title, title_ar, category, file_url)
      )
    `)
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[getMyOrders]", error);
    return [];
  }
  return data || [];
};

export const getPlatformStats = async () => {
  // Use count: exact to get just the count without data
  const [jobs, candidates, orgs] = await Promise.all([
    supabase.from("jobs").select("*", { count: 'exact', head: true }).eq("status", "published"),
    supabase.from("profiles").select("*", { count: 'exact', head: true }).eq("role", "candidate"),
    supabase.from("organizations").select("*", { count: 'exact', head: true }).eq("status", "active"),
  ]);

  return {
    jobs: jobs.count || 0,
    candidates: candidates.count || 0,
    organizations: orgs.count || 0,
  };
};
