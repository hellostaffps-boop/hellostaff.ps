/**
 * teamService.js — Phase 6: Organization Team Management
 *
 * Security model:
 * - Owner-only: add/remove members, change roles
 * - Member reads: any active org member may list team
 * - Invitations are stored as pending records — no direct role assignment
 * - platform_admin is never exposed or assignable here
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEmployerProfile } from "@/lib/firestoreService";

// Organization roles visible in self-service team management
export const ORG_ROLES = ["owner", "manager"];

export const ORG_ROLE_LABELS = {
  en: { owner: "Owner", manager: "Manager / Recruiter" },
  ar: { owner: "مالك", manager: "مدير / مجنِّد" },
};

export const INVITATION_STATUSES = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  cancelled: "cancelled",
};

// ─── Membership reads ─────────────────────────────────────────────────────────

/**
 * Get all active members of an organization.
 * Caller must be an active member of the org (validated by passing uid + orgId).
 */
export const getOrganizationMembersForOwner = async (uid, orgId) => {
  // Verify caller is owner of this org
  const orgSnap = await getDoc(doc(db, "organizations", orgId));
  if (!orgSnap.exists()) throw new Error("Organization not found");
  if (orgSnap.data().owner_user_id !== uid) throw new Error("FORBIDDEN: owner only");

  const q = query(
    collection(db, "organization_members"),
    where("organization_id", "==", orgId),
    orderBy("created_at", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get members safe — any active member of the org can read the list.
 * Verifies caller is an active member before returning.
 */
export const getOrganizationMembersSafe = async (uid, orgId) => {
  const q = query(
    collection(db, "organization_members"),
    where("organization_id", "==", orgId),
    where("user_id", "==", uid),
    where("status", "==", "active"),
    limit(1)
  );
  const memberSnap = await getDocs(q);
  if (memberSnap.empty) throw new Error("FORBIDDEN: not a member of this organization");

  const allQ = query(
    collection(db, "organization_members"),
    where("organization_id", "==", orgId),
    orderBy("created_at", "asc")
  );
  const snap = await getDocs(allQ);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Get the current user's own membership record for their org.
 */
export const getCurrentOrganizationMembership = async (uid) => {
  const profile = await getEmployerProfile(uid);
  if (!profile?.organization_id) return null;

  const q = query(
    collection(db, "organization_members"),
    where("organization_id", "==", profile.organization_id),
    where("user_id", "==", uid),
    where("status", "==", "active"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

/**
 * Get the current user's role within their organization.
 * Returns null if not a member.
 */
export const getOrganizationRoleForCurrentUser = async (uid) => {
  const membership = await getCurrentOrganizationMembership(uid);
  return membership?.role || null;
};

// ─── Team member count ────────────────────────────────────────────────────────

export const getOrganizationMemberCount = async (orgId) => {
  const q = query(
    collection(db, "organization_members"),
    where("organization_id", "==", orgId),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  return snap.size;
};

// ─── Pending invitations ──────────────────────────────────────────────────────

/**
 * Owner creates a team invitation record.
 * Does NOT directly assign a Firestore role — this is a safe invitation workflow.
 * The invited user's account must exist and will be linked on acceptance.
 */
export const requestAddTeamMember = async (ownerUid, orgId, inviteeEmail, role) => {
  // Verify caller is owner
  const orgSnap = await getDoc(doc(db, "organizations", orgId));
  if (!orgSnap.exists()) throw new Error("Organization not found");
  if (orgSnap.data().owner_user_id !== ownerUid) throw new Error("FORBIDDEN: owner only");

  // Prevent inviting to platform_admin or owner via self-service
  if (!ORG_ROLES.includes(role) || role === "owner") {
    throw new Error("FORBIDDEN: invalid role for team invitation");
  }

  // Check for duplicate pending invitation
  const dupQ = query(
    collection(db, "team_invitations"),
    where("organization_id", "==", orgId),
    where("invitee_email", "==", inviteeEmail.toLowerCase().trim()),
    where("status", "==", "pending")
  );
  const dupSnap = await getDocs(dupQ);
  if (!dupSnap.empty) throw new Error("DUPLICATE: pending invitation already exists for this email");

  return addDoc(collection(db, "team_invitations"), {
    organization_id: orgId,
    invited_by_uid: ownerUid,
    invitee_email: inviteeEmail.toLowerCase().trim(),
    role,
    status: "pending",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
};

/**
 * Owner cancels a pending invitation.
 */
export const cancelTeamInvitation = async (ownerUid, orgId, invitationId) => {
  const orgSnap = await getDoc(doc(db, "organizations", orgId));
  if (!orgSnap.exists() || orgSnap.data().owner_user_id !== ownerUid) {
    throw new Error("FORBIDDEN: owner only");
  }
  return updateDoc(doc(db, "team_invitations", invitationId), {
    status: "cancelled",
    updated_at: serverTimestamp(),
  });
};

/**
 * Get pending invitations for an organization (owner only).
 */
export const getPendingInvitations = async (ownerUid, orgId) => {
  const orgSnap = await getDoc(doc(db, "organizations", orgId));
  if (!orgSnap.exists() || orgSnap.data().owner_user_id !== ownerUid) {
    throw new Error("FORBIDDEN: owner only");
  }
  const q = query(
    collection(db, "team_invitations"),
    where("organization_id", "==", orgId),
    where("status", "==", "pending"),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Member removal ───────────────────────────────────────────────────────────

/**
 * Owner removes an active member (sets status to "removed").
 * Cannot remove themselves (the owner).
 */
export const requestRemoveOrganizationMember = async (ownerUid, orgId, memberDocId, memberUserId) => {
  const orgSnap = await getDoc(doc(db, "organizations", orgId));
  if (!orgSnap.exists() || orgSnap.data().owner_user_id !== ownerUid) {
    throw new Error("FORBIDDEN: owner only");
  }
  if (memberUserId === ownerUid) throw new Error("FORBIDDEN: cannot remove the organization owner");

  return updateDoc(doc(db, "organization_members", memberDocId), {
    status: "removed",
    updated_at: serverTimestamp(),
  });
};