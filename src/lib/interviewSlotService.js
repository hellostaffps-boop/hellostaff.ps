/**
 * interviewSlotService.js — Supabase implementation.
 * Uses interview_slots table.
 */

import { supabase } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/supabaseService";

export const getInterviewSlot = async (applicationId) => {
  const { data, error } = await supabase
    .from("interview_slots")
    .select("*")
    .eq("application_id", applicationId)
    .single();
  if (error && error.code !== "PGRST116") console.error("[getInterviewSlot]", error);
  return data || null;
};

export const getInterviewSlotsForApplications = async (applicationIds) => {
  if (!applicationIds?.length) return {};
  const { data, error } = await supabase
    .from("interview_slots")
    .select("*")
    .in("application_id", applicationIds);
  if (error) throw error;
  const map = {};
  (data || []).forEach((s) => { map[s.application_id] = s; });
  return map;
};

export const proposeInterviewSlots = async ({
  applicationId, organizationId, candidateEmail, candidateName,
  employerEmail, jobTitle, organizationName,
  proposedSlots, location, interviewType, notes
}) => {
  const existing = await getInterviewSlot(applicationId);
  const payload = {
    application_id: applicationId,
    organization_id: organizationId,
    candidate_email: candidateEmail,
    candidate_name: candidateName || candidateEmail,
    employer_email: employerEmail,
    job_title: jobTitle,
    organization_name: organizationName,
    proposed_slots: proposedSlots,
    selected_slot: null,
    location: location || "",
    interview_type: interviewType || "in_person",
    notes: notes || "",
    status: "pending_selection",
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from("interview_slots").update(payload).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("interview_slots").insert(payload);
    if (error) throw error;
  }

  try {
    await createNotification({
      userEmail: candidateEmail,
      title: "دعوة لاختيار موعد مقابلة",
      message: `قدّم لك ${organizationName} مواعيد لاختيار موعد مقابلة وظيفة "${jobTitle}"`,
      type: "application",
      link: "/candidate/applications",
    });
  } catch (_) {}
};

export const selectInterviewSlot = async (slotId, selectedSlot) => {
  const { data: s, error: findErr } = await supabase
    .from("interview_slots").select("*").eq("id", slotId).single();
  if (findErr || !s) throw new Error("Slot not found");

  const { error } = await supabase.from("interview_slots").update({
    selected_slot: selectedSlot,
    status: "confirmed",
    updated_at: new Date().toISOString(),
  }).eq("id", slotId);
  if (error) throw error;

  try {
    await createNotification({
      userEmail: s.employer_email,
      title: `${s.candidate_name} اختار موعد المقابلة`,
      message: `تم تحديد موعد مقابلة "${s.job_title}" في ${new Date(selectedSlot).toLocaleString("ar-SA")}`,
      type: "application",
      link: "/employer/applications",
    });
  } catch (_) {}

  return s;
};