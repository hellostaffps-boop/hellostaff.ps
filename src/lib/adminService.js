/**
 * adminService.js — Migrated from Firestore to base44 entities.
 * Admin area uses backend functions for most operations.
 * Direct entity reads are used for simple dashboard queries.
 */

import { base44 } from "@/api/base44Client";

const assertAdmin = (userProfile) => {
  if (!userProfile || userProfile.role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required");
  }
};

export const getAdminDashboardDataSafe = async (userProfile) => {
  assertAdmin(userProfile);

  const [users, jobs, apps, orgs] = await Promise.all([
    base44.entities.User.list(),
    base44.entities.Job.list(),
    base44.entities.Application.list(),
    base44.entities.Organization.list(),
  ]);

  return {
    totalUsers: users.length,
    totalCandidates: users.filter((u) => u.role === "candidate").length,
    totalEmployers: users.filter((u) => ["employer_owner", "employer_manager"].includes(u.role)).length,
    totalAdmins: users.filter((u) => u.role === "platform_admin").length,
    totalJobs: jobs.length,
    publishedJobs: jobs.filter((j) => j.status === "published").length,
    totalApplications: apps.length,
    totalOrganizations: orgs.length,
    activeOrganizations: orgs.filter((o) => o.status === "active").length,
  };
};

export const getAdminUsersSafe = async (userProfile, maxCount = 100) => {
  assertAdmin(userProfile);
  return base44.entities.User.list("-created_date", maxCount);
};

export const getAdminOrganizationsSafe = async (userProfile) => {
  assertAdmin(userProfile);
  return base44.entities.Organization.list("-created_date", 200);
};

export const getAdminReportsSafe = async (userProfile) => {
  assertAdmin(userProfile);
  return base44.entities.AdminReport.filter({ status: "pending" }, "-created_date", 100);
};

export const verifyOrganization = async (userProfile, orgId) => {
  assertAdmin(userProfile);
  return base44.entities.Organization.update(orgId, {
    verified: true,
    verified_by: userProfile.email,
  });
};

export const updateAdminReportStatus = async (userProfile, reportId, status, notes = "") => {
  assertAdmin(userProfile);
  const VALID = ["reviewed", "resolved", "dismissed"];
  if (!VALID.includes(status)) throw new Error("Invalid report status");
  return base44.entities.AdminReport.update(reportId, {
    status,
    notes,
    reviewed_by: userProfile.email,
  });
};

export { getAuditLogsSafe, getAuditLogsForTarget, getFailedAuditLogsSafe } from "@/lib/backend/auditLogService";