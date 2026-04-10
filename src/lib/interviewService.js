/**
 * interviewService.js — Migrated from Firestore to base44 entities (Interview entity).
 * uid parameters now receive email (see supabaseAuth normalization).
 */

import { base44 } from "@/api/base44Client";
import { getEmployerProfile } from "@/lib/firestoreService";

const first = (arr) => (arr?.length > 0 ? arr[0] : null);

export const getInterview = async (applicationId) => {
  const results = await base44.entities.Interview.filter({ application_id: applicationId });
  return first(results);
};

export const subscribeToInterview = (applicationId, callback) => {
  // Load initial interview
  getInterview(applicationId).then(callback);
  // Subscribe to changes
  return base44.entities.Interview.subscribe((event) => {
    if (event.data?.application_id === applicationId) {
      callback(event.data);
    }
  });
};

export const getInterviewsForApplications = async (applicationIds) => {
  if (!applicationIds?.length) return {};
  const map = {};
  await Promise.all(
    applicationIds.map(async (appId) => {
      const interview = await getInterview(appId);
      if (interview) map[appId] = interview;
    })
  );
  return map;
};

export const scheduleInterview = async (employerUid, applicationId, { scheduled_at, location, type, notes }) => {
  const profile = await getEmployerProfile(employerUid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const apps = await base44.entities.Application.filter({ id: applicationId });
  const app = apps[0];
  if (!app) throw new Error("Application not found");
  if (app.organization_id !== profile.organization_id)
    throw new Error("FORBIDDEN: application belongs to another organization");

  const existing = await getInterview(applicationId);

  const payload = {
    application_id: applicationId,
    job_title: app.job_title || "",
    candidate_email: app.candidate_email || "",
    candidate_name: app.candidate_name || app.candidate_email || "",
    organization_id: profile.organization_id,
    scheduled_at,
    location: location || "",
    type: type || "in_person",
    notes: notes || "",
    status: "scheduled",
  };

  if (existing?.id) {
    await base44.entities.Interview.update(existing.id, payload);
  } else {
    await base44.entities.Interview.create(payload);
  }

  // Notify candidate
  try {
    if (app.candidate_email) {
      const isReschedule = !!existing;
      await base44.entities.Notification.create({
        user_email: app.candidate_email,
        title: isReschedule ? "تحديث موعد المقابلة" : "🎉 تمت جدولة مقابلتك",
        message: isReschedule
          ? `تم تحديث موعد مقابلتك لوظيفة "${app.job_title || "الوظيفة"}"`
          : `تهانينا! تمت جدولة مقابلة لوظيفة "${app.job_title || "الوظيفة"}"`,
        type: "application",
        link: "/candidate/applications",
        read: false,
      });
    }
  } catch (_) {}
};

export const saveInterviewEvaluation = async (employerUid, applicationId, { evaluation_notes, strengths, weaknesses, recommendation, rating }) => {
  const profile = await getEmployerProfile(employerUid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const apps = await base44.entities.Application.filter({ id: applicationId });
  const app = apps[0];
  if (!app) throw new Error("Application not found");
  if (app.organization_id !== profile.organization_id) throw new Error("FORBIDDEN");

  const existing = await getInterview(applicationId);
  if (!existing?.id) throw new Error("Interview not found");

  return base44.entities.Interview.update(existing.id, {
    evaluation_notes: evaluation_notes || "",
    strengths: strengths || "",
    weaknesses: weaknesses || "",
    recommendation: recommendation || "",
    rating: rating ?? null,
    status: "completed",
  });
};