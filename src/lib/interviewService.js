/**
 * interviewService.js — Interview Scheduling & Evaluation
 *
 * One interview document per application (doc ID = application ID).
 * Security:
 * - Schedule/update: employer who owns the application's org
 * - Read: employer org members + the candidate on the application
 * - Candidate gets a notification when interview is scheduled/updated
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getEmployerProfile } from "@/lib/firestoreService";

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getInterview = async (applicationId) => {
  const snap = await getDoc(doc(db, "interviews", applicationId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const subscribeToInterview = (applicationId, callback) =>
  onSnapshot(doc(db, "interviews", applicationId), (snap) =>
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  );

// Fetch interviews for a list of application IDs (batch read)
export const getInterviewsForApplications = async (applicationIds) => {
  if (!applicationIds.length) return {};
  const map = {};
  await Promise.all(
    applicationIds.map(async (appId) => {
      const snap = await getDoc(doc(db, "interviews", appId));
      if (snap.exists()) map[appId] = { id: snap.id, ...snap.data() };
    })
  );
  return map;
};

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Employer schedules or reschedules an interview.
 * Validates the application belongs to the employer's organization.
 */
export const scheduleInterview = async (employerUid, applicationId, { scheduled_at, location, type, notes }) => {
  const profile = await getEmployerProfile(employerUid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const appSnap = await getDoc(doc(db, "applications", applicationId));
  if (!appSnap.exists()) throw new Error("Application not found");
  const app = appSnap.data();
  if (app.organization_id !== profile.organization_id)
    throw new Error("FORBIDDEN: application belongs to another organization");

  const isReschedule = (await getDoc(doc(db, "interviews", applicationId))).exists();

  await setDoc(doc(db, "interviews", applicationId), {
    application_id: applicationId,
    job_title: app.job_title || "",
    candidate_user_id: app.candidate_user_id || "",
    candidate_name: app.candidate_name || app.candidate_email || "",
    organization_id: profile.organization_id,
    scheduled_at, // ISO string from datetime-local input
    location: location || "",
    type: type || "in_person", // "in_person" | "online" | "phone"
    notes: notes || "",
    status: "scheduled",
    evaluation_notes: "",
    rating: null,
    created_at: isReschedule ? undefined : serverTimestamp(),
    updated_at: serverTimestamp(),
  }, { merge: true });

  // Notify candidate
  try {
    if (app.candidate_user_id) {
      const msg = isReschedule
        ? `تم تحديث موعد مقابلتك لوظيفة "${app.job_title || "الوظيفة"}" — تحقق من التفاصيل.`
        : `تهانينا! تمت جدولة مقابلة لوظيفة "${app.job_title || "الوظيفة"}". تحقق من التفاصيل.`;
      await addDoc(collection(db, "notifications"), {
        user_id: app.candidate_user_id,
        title: isReschedule ? "تحديث موعد المقابلة" : "🎉 تمت جدولة مقابلتك",
        message: msg,
        type: "application",
        link: "/candidate/applications",
        is_read: false,
        created_at: serverTimestamp(),
      });
    }
  } catch (_) { /* non-blocking */ }
};

// ─── Evaluation Notes ─────────────────────────────────────────────────────────

/**
 * Employer saves post-interview evaluation notes & rating.
 */
export const saveInterviewEvaluation = async (employerUid, applicationId, { evaluation_notes, strengths, weaknesses, recommendation, rating }) => {
  const profile = await getEmployerProfile(employerUid);
  if (!profile?.organization_id) throw new Error("No organization for this employer");

  const appSnap = await getDoc(doc(db, "applications", applicationId));
  if (!appSnap.exists()) throw new Error("Application not found");
  if (appSnap.data().organization_id !== profile.organization_id)
    throw new Error("FORBIDDEN");

  await updateDoc(doc(db, "interviews", applicationId), {
    evaluation_notes: evaluation_notes || "",
    strengths: strengths || "",
    weaknesses: weaknesses || "",
    recommendation: recommendation || "",
    rating: rating ?? null,
    status: "completed",
    updated_at: serverTimestamp(),
  });
};