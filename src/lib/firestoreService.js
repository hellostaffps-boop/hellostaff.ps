import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Users ─────────────────────────────────────────────────────────────────
export const getUser = (uid) => getDoc(doc(db, "users", uid)).then((s) => s.data());
export const updateUser = (uid, data) => setDoc(doc(db, "users", uid), data, { merge: true });

// ─── Candidate Profiles ────────────────────────────────────────────────────
export const getCandidateProfile = (uid) =>
  getDoc(doc(db, "candidate_profiles", uid)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

export const saveCandidateProfile = (uid, data) =>
  setDoc(doc(db, "candidate_profiles", uid), { ...data, updated_at: serverTimestamp() }, { merge: true });

// ─── Employer Profiles ─────────────────────────────────────────────────────
export const getEmployerProfile = (uid) =>
  getDoc(doc(db, "employer_profiles", uid)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

export const saveEmployerProfile = (uid, data) =>
  setDoc(doc(db, "employer_profiles", uid), { ...data, updated_at: serverTimestamp() }, { merge: true });

// ─── Organizations ─────────────────────────────────────────────────────────
export const getOrganization = (orgId) =>
  getDoc(doc(db, "organizations", orgId)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

export const saveOrganization = (orgId, data) =>
  setDoc(doc(db, "organizations", orgId), { ...data, updated_at: serverTimestamp() }, { merge: true });

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const getPublishedJobs = async () => {
  const q = query(collection(db, "jobs"), where("status", "==", "published"), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getJobsByOrg = async (orgId) => {
  const q = query(collection(db, "jobs"), where("organization_id", "==", orgId), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getJob = (jobId) =>
  getDoc(doc(db, "jobs", jobId)).then((s) => (s.exists() ? { id: s.id, ...s.data() } : null));

export const createJob = (data) =>
  addDoc(collection(db, "jobs"), { ...data, created_at: serverTimestamp(), updated_at: serverTimestamp() });

export const updateJob = (jobId, data) =>
  updateDoc(doc(db, "jobs", jobId), { ...data, updated_at: serverTimestamp() });

export const deleteJob = (jobId) => deleteDoc(doc(db, "jobs", jobId));

// ─── Applications ──────────────────────────────────────────────────────────
export const getApplicationsByCandidate = async (uid) => {
  const q = query(collection(db, "applications"), where("candidate_user_id", "==", uid), orderBy("applied_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getApplicationsByOrg = async (orgId) => {
  const q = query(collection(db, "applications"), where("organization_id", "==", orgId), orderBy("applied_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const checkExistingApplication = async (jobId, candidateUid) => {
  const q = query(
    collection(db, "applications"),
    where("job_id", "==", jobId),
    where("candidate_user_id", "==", candidateUid)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};

export const createApplication = (data) =>
  addDoc(collection(db, "applications"), { ...data, applied_at: serverTimestamp(), status: "submitted" });

export const updateApplication = (appId, data) =>
  updateDoc(doc(db, "applications", appId), data);

// ─── Notifications ─────────────────────────────────────────────────────────
export const getNotifications = async (uid) => {
  const q = query(collection(db, "notifications"), where("user_id", "==", uid), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markNotificationRead = (notifId) =>
  updateDoc(doc(db, "notifications", notifId), { is_read: true });