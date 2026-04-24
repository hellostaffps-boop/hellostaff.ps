/**
 * savedJobsService.js — Supabase implementation.
 * Uses saved_jobs table. uid = user email.
 */

import { supabase } from "@/lib/supabaseClient";

export const getSavedJobs = async (userEmail) => {
  if (!userEmail) return [];
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getSavedJobIds = async (userEmail) => {
  const docs = await getSavedJobs(userEmail);
  return new Set(docs.map((d) => d.job_id));
};

export const isJobSaved = async (userEmail, jobId) => {
  if (!userEmail || !jobId) return false;
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("id")
    .eq("user_email", userEmail)
    .eq("job_id", jobId);
  if (error) return false;
  return (data?.length || 0) > 0;
};

export const saveJob = async (userEmail, job) => {
  if (!userEmail || !job?.id) return;
  const already = await isJobSaved(userEmail, job.id);
  if (already) return;
  const { error } = await supabase.from("saved_jobs").insert({
    user_email: userEmail,
    job_id: job.id,
    job_title: job.title || "",
    organization_name: job.organization_name || "",
    job_type: job.job_type || "",
    location: job.location || "",
  });
  if (error) throw error;
};

export const unsaveJob = async (userEmail, jobId) => {
  if (!userEmail || !jobId) return;
  const { error } = await supabase
    .from("saved_jobs")
    .delete()
    .eq("user_email", userEmail)
    .eq("job_id", jobId);
  if (error) throw error;
};

export const toggleSaveJob = async (userEmail, job) => {
  const saved = await isJobSaved(userEmail, job.id);
  if (saved) {
    await unsaveJob(userEmail, job.id);
    return false;
  }
  await saveJob(userEmail, job);
  return true;
};

export const getSavedJobsCount = async (userEmail) => {
  if (!userEmail) return 0;
  const { count, error } = await supabase
    .from("saved_jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_email", userEmail);
  if (error) return 0;
  return count || 0;
};