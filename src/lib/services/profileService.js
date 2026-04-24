/**
 * profileService.js — Candidate and employer profile Supabase operations.
 */
import { supabase } from "@/lib/supabaseClient";
import { getCandidateCompletion } from "@/lib/profileCompletion";

const PROTECTED_FIELDS = ["role", "status", "is_admin", "admin_notes", "created_at", "uid"];
const stripProtectedFields = (data) => {
  const safe = { ...data };
  PROTECTED_FIELDS.forEach((f) => delete safe[f]);
  return safe;
};

// ─── Candidate Profiles ───────────────────────────────────────────────────────

export const getCandidateProfile = async (userEmail) => {
  if (!userEmail) return null;
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_email", userEmail)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getCandidateProfile]", error);
  return data || null;
};

export const saveCandidateProfile = async (userEmail, data) => {
  const safe = stripProtectedFields(data);
  const existing = await getCandidateProfile(userEmail);
  const merged = { ...(existing || {}), ...safe };
  safe.profile_completion = getCandidateCompletion(merged).score;
  safe.user_email = userEmail;
  safe.updated_at = new Date().toISOString();

  if (existing) {
    const { data: updated, error } = await supabase
      .from("candidate_profiles")
      .update(safe)
      .eq("user_email", userEmail)
      .select()
      .single();
    if (error) throw error;
    return updated;
  } else {
    const { data: created, error } = await supabase
      .from("candidate_profiles")
      .insert({ ...safe, user_email: userEmail })
      .select()
      .single();
    if (error) throw error;
    return created;
  }
};

// ─── Employer Profiles ────────────────────────────────────────────────────────

export const getEmployerProfile = async (userEmail) => {
  if (!userEmail) return null;
  const { data, error } = await supabase
    .from("employer_profiles")
    .select("*")
    .eq("user_email", userEmail)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getEmployerProfile]", error);
  return data || null;
};

export const saveEmployerProfile = async (userEmail, data) => {
  const ALLOWED = ["title", "phone", "avatar_url", "organization_id"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  safe.updated_at = new Date().toISOString();

  const existing = await getEmployerProfile(userEmail);
  if (existing) {
    const { data: updated, error } = await supabase
      .from("employer_profiles")
      .update(safe)
      .eq("user_email", userEmail)
      .select()
      .single();
    if (error) throw error;
    return updated;
  } else {
    const { data: created, error } = await supabase
      .from("employer_profiles")
      .insert({ ...safe, user_email: userEmail })
      .select()
      .single();
    if (error) throw error;
    return created;
  }
};

// ─── Profile Completion ───────────────────────────────────────────────────────

export const calculateEmployerProfileCompletion = (org) => {
  if (!org) return 0;
  const checks = [!!org.name, !!org.business_type, !!org.city, !!org.address,
    !!org.logo_url, !!org.description, !!org.website, !!org.phone];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
