/**
 * teamService.js — Migrated from Firestore to base44 entities.
 * Uses OrganizationMember entity. Pending invitations use status='invited'.
 * uid parameters now receive email (see supabaseAuth normalization).
 */

import { base44 } from "@/api/base44Client";

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

const first = (arr) => (arr?.length > 0 ? arr[0] : null);

const assertOwner = async (uid, orgId) => {
  const orgs = await base44.entities.Organization.filter({ id: orgId, owner_email: uid });
  if (!orgs.length) throw new Error("FORBIDDEN: owner only");
  return orgs[0];
};

// ─── Membership reads ─────────────────────────────────────────────────────────

export const getOrganizationMembersForOwner = async (uid, orgId) => {
  await assertOwner(uid, orgId);
  return base44.entities.OrganizationMember.filter({ organization_id: orgId }, "created_date");
};

export const getOrganizationMembersSafe = async (uid, orgId) => {
  const myMembership = await base44.entities.OrganizationMember.filter({
    organization_id: orgId,
    user_email: uid,
    status: "active",
  });
  if (!myMembership.length) throw new Error("FORBIDDEN: not a member of this organization");
  return base44.entities.OrganizationMember.filter({ organization_id: orgId }, "created_date");
};

export const getCurrentOrganizationMembership = async (uid) => {
  const profile = await base44.entities.EmployerProfile.filter({ user_email: uid });
  const orgId = profile[0]?.organization_id;
  if (!orgId) return null;

  const results = await base44.entities.OrganizationMember.filter({
    organization_id: orgId,
    user_email: uid,
    status: "active",
  });
  return first(results);
};

export const getOrganizationRoleForCurrentUser = async (uid) => {
  const membership = await getCurrentOrganizationMembership(uid);
  return membership?.role || null;
};

export const getOrganizationMemberCount = async (orgId) => {
  const results = await base44.entities.OrganizationMember.filter({
    organization_id: orgId,
    status: "active",
  });
  return results.length;
};

// ─── Pending invitations (stored as OrganizationMember with status='invited') ─

export const requestAddTeamMember = async (ownerUid, orgId, inviteeEmail, role) => {
  await assertOwner(ownerUid, orgId);
  if (!ORG_ROLES.includes(role) || role === "owner")
    throw new Error("FORBIDDEN: invalid role for team invitation");

  // Check for duplicate
  const existing = await base44.entities.OrganizationMember.filter({
    organization_id: orgId,
    user_email: inviteeEmail.toLowerCase().trim(),
    status: "invited",
  });
  if (existing.length) throw new Error("DUPLICATE: pending invitation already exists for this email");

  return base44.entities.OrganizationMember.create({
    organization_id: orgId,
    user_email: inviteeEmail.toLowerCase().trim(),
    role,
    status: "invited",
  });
};

export const cancelTeamInvitation = async (ownerUid, orgId, invitationId) => {
  await assertOwner(ownerUid, orgId);
  return base44.entities.OrganizationMember.delete(invitationId);
};

export const getPendingInvitations = async (ownerUid, orgId) => {
  await assertOwner(ownerUid, orgId);
  return base44.entities.OrganizationMember.filter({
    organization_id: orgId,
    status: "invited",
  }, "-created_date");
};

// ─── Member removal ───────────────────────────────────────────────────────────

export const requestRemoveOrganizationMember = async (ownerUid, orgId, memberDocId, memberUserEmail) => {
  await assertOwner(ownerUid, orgId);
  if (memberUserEmail === ownerUid) throw new Error("FORBIDDEN: cannot remove the organization owner");
  return base44.entities.OrganizationMember.update(memberDocId, { status: "removed" });
};