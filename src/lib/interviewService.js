/**
 * interviewService.js — Supabase implementation.
 * Uses interviews table. uid = user email.
 */

import { supabase } from "@/lib/supabaseClient";
import { getEmployerProfile, createNotification } from "@/lib/supabaseService";

export const getInterview = async (applicationId) => {
  if (!applicationId) return null;
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("application_id", applicationId)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getInterview]", error);
  return data || null;
};

export const subscribeToInterview = (applicationId, callback) => {
  getInterview(applicationId).then(callback);
  const channel = supabase
    .channel(`interview:${applicationId}`)
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "interviews",
      filter: `application_id=eq.${applicationId}`,
    }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
};

export const getInterviewsForApplications = async (applicationIds) => {
  if (!applicationIds?.length) return {};
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .in("application_id", applicationIds);
  if (error) throw error;
  const map = {};
  (data || []).forEach((i) => { map[i.application_id] = i; });
  return map;
};

export const scheduleInterview = async (employerEmail, applicationId, { scheduled_at, location, type, notes }) => {
  const profile = await getEmployerProfile(employerEmail);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const { data: app, error: appErr } = await supabase
    .from("applications").select("*").eq("id", applicationId).single();
  if (appErr || !app) throw new Error("Application not found");
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
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("interviews").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("interviews").insert(payload);
    if (error) throw error;
  }

  try {
    if (app.candidate_email) {
      const isReschedule = !!existing;
      await createNotification({
        userEmail: app.candidate_email,
        title: isReschedule ? "تحديث موعد المقابلة" : "🎉 تمت جدولة مقابلتك",
        message: isReschedule
          ? `تم تحديث موعد مقابلتك لوظيفة "${app.job_title || "الوظيفة"}"`
          : `تهانينا! تمت جدولة مقابلة لوظيفة "${app.job_title || "الوظيفة"}"`,
        type: "application",
        link: "/candidate/applications",
      });
    }
  } catch (_) {}
};

export const saveInterviewEvaluation = async (employerEmail, applicationId, { evaluation_notes, strengths, weaknesses, recommendation, rating }) => {
  const profile = await getEmployerProfile(employerEmail);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const { data: app } = await supabase.from("applications").select("organization_id").eq("id", applicationId).single();
  if (!app || app.organization_id !== profile.organization_id) throw new Error("FORBIDDEN");

  const existing = await getInterview(applicationId);
  if (!existing?.id) throw new Error("Interview not found");

  const { data, error } = await supabase.from("interviews").update({
    evaluation_notes: evaluation_notes || "",
    strengths: strengths || "",
    weaknesses: weaknesses || "",
    recommendation: recommendation || "",
    rating: rating ?? null,
    status: "completed",
    updated_at: new Date().toISOString(),
  }).eq("id", existing.id).select().single();
  if (error) throw error;
  return data;
};