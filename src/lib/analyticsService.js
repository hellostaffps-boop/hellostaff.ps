/**
 * analyticsService.js — Track & retrieve analytics data.
 */

import { supabase } from "@/lib/supabaseClient";

// ─── Track Job View ──────────────────────────────────────────────────────────
export const trackJobView = async (jobId, viewerEmail = null) => {
  if (!jobId) return;
  await supabase.from("job_views").insert({
    job_id: jobId,
    viewer_email: viewerEmail,
  }).then(() => {}).catch(() => {});
};

// ─── Track Profile View ──────────────────────────────────────────────────────
export const trackProfileView = async (profileEmail, viewerEmail = null) => {
  if (!profileEmail) return;
  await supabase.from("profile_views").insert({
    profile_email: profileEmail,
    viewer_email: viewerEmail,
  }).then(() => {}).catch(() => {});
};

// ─── Get Job Analytics ───────────────────────────────────────────────────────
export const getJobAnalytics = async (jobId) => {
  if (!jobId) return { views: 0 };
  const { count } = await supabase
    .from("job_views")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);
  return { views: count || 0 };
};

// ─── Get Employer Analytics (org-level) ──────────────────────────────────────
export const getEmployerAnalytics = async (orgId) => {
  if (!orgId) return { totalViews: 0, recentViews: [], applicationsByStatus: {} };

  // Total views across all org jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id")
    .eq("organization_id", orgId);

  const jobIds = (jobs || []).map(j => j.id);
  let totalViews = 0;

  if (jobIds.length > 0) {
    const { count } = await supabase
      .from("job_views")
      .select("*", { count: "exact", head: true })
      .in("job_id", jobIds);
    totalViews = count || 0;
  }

  // Recent views (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let dailyViews = [];
  if (jobIds.length > 0) {
    const { data: recentData } = await supabase
      .from("job_views")
      .select("viewed_at")
      .in("job_id", jobIds)
      .gte("viewed_at", weekAgo);

    // Group by day
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split("T")[0];
      dayMap[key] = 0;
    }
    (recentData || []).forEach(v => {
      const key = v.viewed_at?.split("T")[0];
      if (key && dayMap[key] !== undefined) dayMap[key]++;
    });
    dailyViews = Object.entries(dayMap).map(([date, count]) => ({ date, count }));
  }

  // Applications by status
  const { data: apps = [] } = await supabase
    .from("applications")
    .select("status")
    .eq("organization_id", orgId);

  const applicationsByStatus = {};
  apps.forEach(a => {
    applicationsByStatus[a.status] = (applicationsByStatus[a.status] || 0) + 1;
  });

  return { totalViews, dailyViews, applicationsByStatus };
};
