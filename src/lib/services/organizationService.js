/**
 * organizationService.js — Organization and membership Supabase operations.
 */
import { supabase } from "@/lib/supabaseClient";
import { getEmployerProfile } from "@/lib/services/profileService";

export const getOrganization = async (orgId) => {
  if (!orgId) return null;
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getOrganization]", error);
  return data || null;
};

export const getOrganizationForCurrentEmployer = async (userEmail) => {
  const profile = await getEmployerProfile(userEmail);
  if (!profile?.organization_id) return null;
  return getOrganization(profile.organization_id);
};

export const getOwnedOrganization = async (userEmail) => {
  if (!userEmail) return null;
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_email", userEmail)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getOwnedOrganization]", error);
  return data || null;
};

export const saveOrganizationIfOwner = async (userEmail, orgId, data) => {
  const org = await getOrganization(orgId);
  if (!org) throw new Error("Organization not found");
  if (org.owner_email !== userEmail) throw new Error("FORBIDDEN: not the organization owner");

  const ALLOWED = ["name", "business_type", "industry", "city", "address", "logo_url",
    "cover_image_url", "description", "website", "phone", "email", "video_url",
    "culture_values", "perks", "team_photos", "founded_year", "instagram_url", "linkedin_url"];
  const safe = {};
  ALLOWED.forEach((k) => { if (data[k] !== undefined) safe[k] = data[k]; });
  safe.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("organizations")
    .update(safe)
    .eq("id", orgId)
    .select()
    .single();
  if (error) throw error;
  return updated;
};

export const createOrganization = async (userEmail, data) => {
  const { data: created, error } = await supabase
    .from("organizations")
    .insert({ ...data, owner_email: userEmail, status: "active" })
    .select()
    .single();
  if (error) throw error;
  return created;
};

export const getCurrentOrganizationMembership = async (userEmail, orgId) => {
  if (!userEmail) return null;
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("user_email", userEmail)
    .eq("organization_id", orgId)
    .eq("status", "active")
    .single();
  if (error && error.code !== "PGRST116") console.error("[getCurrentOrganizationMembership]", error);
  return data || null;
};
