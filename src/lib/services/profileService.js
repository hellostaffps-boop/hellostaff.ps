/**
 * profileService.js — Candidate and employer profile Supabase operations.
 */
import { supabase } from "@/lib/supabaseClient";
import { getCandidateCompletion } from "@/lib/profileCompletion";

const PROTECTED_FIELDS = ["role", "status", "is_admin", "admin_notes", "created_at", "uid", "availability"];
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

export const saveCandidateProfile = async (userId, userEmail, data) => {
  if (!userId || !userEmail) throw new Error("User identification missing");

  const safe = stripProtectedFields(data);
  safe.id = userId; // Ensure we match the auth.users ID
  safe.user_email = userEmail;
  safe.updated_at = new Date().toISOString();

  // Pre-calculate completion
  const existing = await getCandidateProfile(userEmail);
  const merged = { ...(existing || {}), ...safe };
  safe.profile_completion = getCandidateCompletion(merged).score;

  const { data: result, error } = await supabase
    .from("candidate_profiles")
    .upsert(safe, { onConflict: "user_email" })
    .select()
    .single();

  if (error) {
    console.error("[saveCandidateProfile] Error:", error);
    throw error;
  }
  return result;
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

export const saveEmployerProfile = async (userId, userEmail, data) => {
  if (!userId || !userEmail) throw new Error("User identification missing");

  const ALLOWED = ["title", "phone", "avatar_url", "organization_id"];
  const safe = { id: userId, user_email: userEmail };
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  safe.updated_at = new Date().toISOString();

  const { data: result, error } = await supabase
    .from("employer_profiles")
    .upsert(safe, { onConflict: "user_email" })
    .select()
    .single();

  if (error) {
    console.error("[saveEmployerProfile] Error:", error);
    throw error;
  }
  return result;
};

// ─── Profile Completion ───────────────────────────────────────────────────────

export const calculateEmployerProfileCompletion = (org) => {
  if (!org) return 0;
  const checks = [!!org.name, !!org.business_type, !!org.city, !!org.address,
    !!org.logo_url, !!org.description, !!org.website, !!org.phone];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
};
