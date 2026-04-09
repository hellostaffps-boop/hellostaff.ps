/**
 * savedJobsService.js — Phase 5.2
 * Firestore saved jobs / favorites for authenticated candidates.
 *
 * Collection: saved_jobs
 * Doc: { user_id, job_id, job_title, organization_name, created_at }
 *
 * Security rules should enforce:
 *   allow read, write: if request.auth.uid == resource.data.user_id;
 */

import {
  collection, doc, addDoc, deleteDoc,
  getDocs, query, where, orderBy, limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Get all saved job docs for a candidate. Returns array with job_id snapshots. */
export const getSavedJobs = async (uid) => {
  if (!uid) return [];
  const q = query(
    collection(db, "saved_jobs"),
    where("user_id", "==", uid),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/** Get just the set of saved job_ids for quick O(1) lookup. */
export const getSavedJobIds = async (uid) => {
  const docs = await getSavedJobs(uid);
  return new Set(docs.map((d) => d.job_id));
};

/** Check if a specific job is saved by this candidate. */
export const isJobSaved = async (uid, jobId) => {
  if (!uid || !jobId) return false;
  const q = query(
    collection(db, "saved_jobs"),
    where("user_id", "==", uid),
    where("job_id", "==", jobId),
    limit(1)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

/**
 * Save a job. Stores a snapshot of title + org for display without extra fetches.
 * Prevents duplicate (user_id + job_id) by checking first.
 */
export const saveJob = async (uid, job) => {
  if (!uid || !job?.id) return;
  const already = await isJobSaved(uid, job.id);
  if (already) return;
  await addDoc(collection(db, "saved_jobs"), {
    user_id: uid,
    job_id: job.id,
    job_title: job.title || "",
    organization_name: job.organization_name || "",
    job_type: job.job_type || "",
    location: job.location || "",
    created_at: serverTimestamp(),
  });
};

/** Unsave a job — finds and deletes the saved_jobs doc. */
export const unsaveJob = async (uid, jobId) => {
  if (!uid || !jobId) return;
  const q = query(
    collection(db, "saved_jobs"),
    where("user_id", "==", uid),
    where("job_id", "==", jobId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (!snap.empty) await deleteDoc(snap.docs[0].ref);
};

/** Toggle save — returns new saved state (true = now saved). */
export const toggleSaveJob = async (uid, job) => {
  const saved = await isJobSaved(uid, job.id);
  if (saved) {
    await unsaveJob(uid, job.id);
    return false;
  } else {
    await saveJob(uid, job);
    return true;
  }
};

/** Count saved jobs for a candidate (for dashboard stat). */
export const getSavedJobsCount = async (uid) => {
  if (!uid) return 0;
  const q = query(collection(db, "saved_jobs"), where("user_id", "==", uid));
  const snap = await getDocs(q);
  return snap.size;
};