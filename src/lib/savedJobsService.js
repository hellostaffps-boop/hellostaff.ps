/**
 * savedJobsService.js — Migrated from Firestore to base44 entities.
 * uid parameter now receives email (see supabaseAuth normalization).
 */

import { base44 } from "@/api/base44Client";

export const getSavedJobs = async (uid) => {
  if (!uid) return [];
  return base44.entities.SavedJob.filter({ user_email: uid }, "-created_date");
};

export const getSavedJobIds = async (uid) => {
  const docs = await getSavedJobs(uid);
  return new Set(docs.map((d) => d.job_id));
};

export const isJobSaved = async (uid, jobId) => {
  if (!uid || !jobId) return false;
  const results = await base44.entities.SavedJob.filter({ user_email: uid, job_id: jobId });
  return results.length > 0;
};

export const saveJob = async (uid, job) => {
  if (!uid || !job?.id) return;
  const already = await isJobSaved(uid, job.id);
  if (already) return;
  return base44.entities.SavedJob.create({
    user_email: uid,
    job_id: job.id,
    job_title: job.title || "",
    organization_name: job.organization_name || "",
    job_type: job.job_type || "",
    location: job.location || "",
  });
};

export const unsaveJob = async (uid, jobId) => {
  if (!uid || !jobId) return;
  const results = await base44.entities.SavedJob.filter({ user_email: uid, job_id: jobId });
  if (results.length > 0) await base44.entities.SavedJob.delete(results[0].id);
};

export const toggleSaveJob = async (uid, job) => {
  const saved = await isJobSaved(uid, job.id);
  if (saved) {
    await unsaveJob(uid, job.id);
    return false;
  }
  await saveJob(uid, job);
  return true;
};

export const getSavedJobsCount = async (uid) => {
  if (!uid) return 0;
  const results = await base44.entities.SavedJob.filter({ user_email: uid });
  return results.length;
};