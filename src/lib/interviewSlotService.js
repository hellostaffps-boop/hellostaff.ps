import { base44 } from "@/api/base44Client";

export const getInterviewSlot = async (applicationId) => {
  const res = await base44.entities.InterviewSlot.filter({ application_id: applicationId });
  return res?.[0] || null;
};

export const getInterviewSlotsForApplications = async (applicationIds) => {
  if (!applicationIds?.length) return {};
  const map = {};
  await Promise.all(
    applicationIds.map(async (appId) => {
      const slot = await getInterviewSlot(appId);
      if (slot) map[appId] = slot;
    })
  );
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
  };

  if (existing?.id) {
    await base44.entities.InterviewSlot.update(existing.id, payload);
  } else {
    await base44.entities.InterviewSlot.create(payload);
  }

  // Notify candidate in-app
  try {
    await base44.entities.Notification.create({
      user_email: candidateEmail,
      title: "دعوة لاختيار موعد مقابلة",
      message: `قدّم لك ${organizationName} مواعيد لاختيار موعد مقابلة وظيفة "${jobTitle}"`,
      type: "application",
      link: "/candidate/applications",
      read: false,
    });
  } catch (_) {}

  // Send email
  try {
    await base44.functions.invoke("sendInterviewEmail", {
      type: "slots_proposed",
      to: candidateEmail,
      candidateName,
      jobTitle,
      organizationName,
      slots: proposedSlots,
      location,
      interviewType,
      notes,
    });
  } catch (_) {}
};

export const selectInterviewSlot = async (slotId, selectedSlot) => {
  const slot = await base44.entities.InterviewSlot.filter({ id: slotId });
  const s = slot?.[0];
  if (!s) throw new Error("Slot not found");

  await base44.entities.InterviewSlot.update(slotId, {
    selected_slot: selectedSlot,
    status: "confirmed",
  });

  // Notify employer
  try {
    await base44.entities.Notification.create({
      user_email: s.employer_email,
      title: `${s.candidate_name} اختار موعد المقابلة`,
      message: `تم تحديد موعد مقابلة "${s.job_title}" في ${new Date(selectedSlot).toLocaleString("ar-SA")}`,
      type: "application",
      link: "/employer/applications",
      read: false,
    });
  } catch (_) {}

  // Emails to both
  try {
    await base44.functions.invoke("sendInterviewEmail", {
      type: "slot_selected_employer",
      to: s.employer_email,
      candidateName: s.candidate_name,
      employerName: s.organization_name,
      jobTitle: s.job_title,
      organizationName: s.organization_name,
      selectedSlot,
      location: s.location,
      interviewType: s.interview_type,
    });
    await base44.functions.invoke("sendInterviewEmail", {
      type: "slot_selected_candidate",
      to: s.candidate_email,
      candidateName: s.candidate_name,
      jobTitle: s.job_title,
      organizationName: s.organization_name,
      selectedSlot,
      location: s.location,
      interviewType: s.interview_type,
      notes: s.notes,
    });
  } catch (_) {}

  return s;
};