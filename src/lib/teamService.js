/**
 * teamService.js — Supabase implementation.
 * Uses organization_members table. uid = user email.
 */

import { supabase } from "@/lib/supabaseClient";

export const ORG_ROLES = ["owner", "manager"];

export const ORG_ROLE_LABELS = {
  en: { owner: "Owner", manager: "Manager / Recruiter" },
  ar: { owner: "مالك", manager: "مدير / مجنِّد" },
};

export const INVITATION_STATUSES = {
  pending: "invited",
  accepted: "active",
  rejected: "removed",
  cancelled: "removed",
};

const assertOwner = async (userEmail, orgId) => {
  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("owner_email", userEmail)
    .single();
  if (error || !data) throw new Error("FORBIDDEN: owner only");
  return data;
};

// ─── Membership reads ─────────────────────────────────────────────────────────

export const getOrganizationMembersForOwner = async (userEmail, orgId) => {
  await assertOwner(userEmail, orgId);
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getOrganizationMembersSafe = async (userEmail, orgId) => {
  const { data: myMembership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_email", userEmail)
    .eq("status", "active")
    .single();
  if (!myMembership) throw new Error("FORBIDDEN: not a member of this organization");

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getCurrentOrganizationMembership = async (userEmail) => {
  const { data: empProfile } = await supabase
    .from("employer_profiles")
    .select("organization_id")
    .eq("user_email", userEmail)
    .single();
  const orgId = empProfile?.organization_id;
  if (!orgId) return null;

  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .eq("user_email", userEmail)
    .eq("status", "active")
    .single();
  if (error && error.code !== "PGRST116") return null;
  return data || null;
};

export const getOrganizationRoleForCurrentUser = async (userEmail) => {
  const membership = await getCurrentOrganizationMembership(userEmail);
  return membership?.role || null;
};

export const getOrganizationMemberCount = async (orgId) => {
  const { count, error } = await supabase
    .from("organization_members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");
  if (error) return 0;
  return count || 0;
};

// ─── Pending invitations ──────────────────────────────────────────────────────

export const requestAddTeamMember = async (ownerEmail, orgId, inviteeEmail, role) => {
  await assertOwner(ownerEmail, orgId);
  if (!ORG_ROLES.includes(role) || role === "owner")
    throw new Error("FORBIDDEN: invalid role for team invitation");

  const { data: existing } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_email", inviteeEmail.toLowerCase().trim())
    .eq("status", "invited")
    .single();
  if (existing) throw new Error("DUPLICATE: pending invitation already exists for this email");

  const { data, error } = await supabase.from("organization_members").insert({
    organization_id: orgId,
    user_email: inviteeEmail.toLowerCase().trim(),
    role,
    status: "invited",
  }).select().single();
  if (error) throw error;
  return data;
};

export const cancelTeamInvitation = async (ownerEmail, orgId, invitationId) => {
  await assertOwner(ownerEmail, orgId);
  const { error } = await supabase
    .from("organization_members").delete().eq("id", invitationId);
  if (error) throw error;
};

export const getPendingInvitations = async (ownerEmail, orgId) => {
  await assertOwner(ownerEmail, orgId);
  const { data, error } = await supabase
    .from("organization_members")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "invited")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

// ─── Member removal ───────────────────────────────────────────────────────────

export const requestRemoveOrganizationMember = async (ownerEmail, orgId, memberDocId, memberUserEmail) => {
  await assertOwner(ownerEmail, orgId);
  if (memberUserEmail === ownerEmail) throw new Error("FORBIDDEN: cannot remove the organization owner");
  const { error } = await supabase
    .from("organization_members")
    .update({ status: "removed", updated_at: new Date().toISOString() })
    .eq("id", memberDocId);
  if (error) throw error;
};