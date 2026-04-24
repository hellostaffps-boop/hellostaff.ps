/**
 * reviewService.js — Manages company and employee reviews/ratings.
 */

import { supabase } from "@/lib/supabaseClient";

// ─── Company Reviews (candidates reviewing companies) ────────────────────────

export const getCompanyReviews = async (orgId) => {
  if (!orgId) return [];
  const { data, error } = await supabase
    .from("company_reviews")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) console.error("[getCompanyReviews]", error);
  return data || [];
};

export const getCompanyAverageRating = async (orgId) => {
  if (!orgId) return null;
  const { data, error } = await supabase
    .from("company_reviews")
    .select("rating, environment_rating, management_rating, salary_rating")
    .eq("organization_id", orgId)
    .eq("status", "published");
  if (error || !data?.length) return null;
  const avg = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length;
  return {
    overall: Math.round(avg(data, "rating") * 10) / 10,
    environment: Math.round(avg(data, "environment_rating") * 10) / 10,
    management: Math.round(avg(data, "management_rating") * 10) / 10,
    salary: Math.round(avg(data, "salary_rating") * 10) / 10,
    count: data.length,
  };
};

export const submitCompanyReview = async ({ orgId, reviewerEmail, reviewerName, rating, environment_rating, management_rating, salary_rating, review_text }) => {
  // 1. Strict Check: Only one review allowed per user per org
  const alreadyReviewed = await hasReviewedCompany(orgId, reviewerEmail);
  if (alreadyReviewed) throw new Error("ALREADY_REVIEWED");

  // 2. Fetch Reviewer Profile for title
  const { data: profile } = await supabase
    .from("candidate_profiles")
    .select("title")
    .eq("user_email", reviewerEmail)
    .single();

  const reviewerTitle = profile?.title || "موظف";

  // 3. Insert Review (No editing allowed)
  const { data: review, error } = await supabase
    .from("company_reviews")
    .insert({
      organization_id: orgId,
      reviewer_email: reviewerEmail,
      reviewer_name: reviewerName,
      reviewer_title: reviewerTitle,
      rating,
      environment_rating,
      management_rating,
      salary_rating,
      review_text,
      status: "published",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;

  // 4. Anonymous Notification to Owner
  try {
    const { data: org } = await supabase.from("organizations").select("owner_email").eq("id", orgId).single();

    if (org?.owner_email) {
      const { createNotification } = await import("@/lib/supabaseService");
      
      await createNotification({
        userEmail: org.owner_email,
        title: "تقييم جديد لمنشأتك",
        message: `لقد تم تقييم منشأتك من قبل ${reviewerTitle}`,
        type: "general",
        link: "/employer/company"
      });
    }
  } catch (err) {
    console.error("Failed to send review notification:", err);
  }

  return review;
};

export const hasReviewedCompany = async (orgId, email) => {
  const { data } = await supabase
    .from("company_reviews")
    .select("id")
    .eq("organization_id", orgId)
    .eq("reviewer_email", email)
    .maybeSingle();
  return !!data;
};

// ─── Employee Reviews (employers reviewing candidates) ───────────────────────

export const getEmployeeReviews = async (candidateEmail) => {
  if (!candidateEmail) return [];
  const { data, error } = await supabase
    .from("employee_reviews")
    .select("*")
    .eq("candidate_email", candidateEmail)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) console.error("[getEmployeeReviews]", error);
  return data || [];
};

export const getEmployeeAverageRating = async (candidateEmail) => {
  if (!candidateEmail) return null;
  const { data, error } = await supabase
    .from("employee_reviews")
    .select("rating, professionalism, punctuality, skills_rating")
    .eq("candidate_email", candidateEmail)
    .eq("status", "published");
  if (error || !data?.length) return null;
  const avg = (arr, key) => arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length;
  return {
    overall: Math.round(avg(data, "rating") * 10) / 10,
    professionalism: Math.round(avg(data, "professionalism") * 10) / 10,
    punctuality: Math.round(avg(data, "punctuality") * 10) / 10,
    skills: Math.round(avg(data, "skills_rating") * 10) / 10,
    count: data.length,
  };
};

export const submitEmployeeReview = async ({ candidateEmail, orgId, reviewerEmail, reviewerName, rating, professionalism, punctuality, skills_rating, review_text }) => {
  // 1. Strict Check
  const { data: existing } = await supabase
    .from("employee_reviews")
    .select("id")
    .eq("candidate_email", candidateEmail)
    .eq("organization_id", orgId)
    .maybeSingle();
  
  if (existing) throw new Error("ALREADY_REVIEWED");

  // 2. Fetch Owner/Manager title
  const { data: employerProfile } = await supabase
    .from("employer_profiles")
    .select("title")
    .eq("user_email", reviewerEmail)
    .single();

  // 3. Insert
  const { data: review, error } = await supabase
    .from("employee_reviews")
    .insert({
      candidate_email: candidateEmail,
      organization_id: orgId,
      reviewer_email: reviewerEmail,
      reviewer_name: reviewerName,
      reviewer_title: employerProfile?.title || "صاحب عمل",
      rating,
      professionalism,
      punctuality,
      skills_rating,
      review_text,
      status: "published",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return review;
};
