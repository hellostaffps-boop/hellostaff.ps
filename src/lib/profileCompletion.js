/**
 * profileCompletion.js — Phase 5.1
 * Centralized profile completion scoring for candidates and employers.
 * Returns a score 0–100 and a list of missing items for next-action guidance.
 */

// ─── Candidate ────────────────────────────────────────────────────────────────

const CANDIDATE_WEIGHTS = [
  { key: "headline",            weight: 10, check: (p) => !!p?.headline },
  { key: "bio",                 weight: 10, check: (p) => !!p?.bio },
  { key: "city",                weight: 5,  check: (p) => !!p?.city },
  { key: "phone",               weight: 5,  check: (p) => !!p?.phone },
  { key: "whatsapp_number",     weight: 5,  check: (p) => !!p?.whatsapp_number },
  { key: "preferred_roles",     weight: 10, check: (p) => p?.preferred_roles?.length > 0 },
  { key: "skills",              weight: 15, check: (p) => p?.skills?.length > 0 },
  { key: "availability",        weight: 5,  check: (p) => !!p?.availability },
  { key: "current_status",      weight: 5,  check: (p) => !!p?.current_status },
  { key: "expected_salary_min", weight: 5,  check: (p) => p?.expected_salary_min > 0 },
  { key: "years_experience",    weight: 5,  check: (p) => p?.years_experience != null && p.years_experience !== "" },
  { key: "work_experience",     weight: 10, check: (p) => p?.work_experience?.length > 0 },
  { key: "cv_url",              weight: 5,  check: (p) => !!p?.cv_url },
  { key: "intro_video_url",     weight: 5,  check: (p) => !!p?.intro_video_url },
];

/**
 * @param {object|null} profile - candidate profile doc
 * @returns {{ score: number, missing: string[], strong: boolean }}
 */
export const getCandidateCompletion = (profile) => {
  if (!profile) return { score: 0, missing: CANDIDATE_WEIGHTS.map((w) => w.key), strong: false };
  let score = 0;
  const missing = [];
  CANDIDATE_WEIGHTS.forEach(({ key, weight, check }) => {
    if (check(profile)) score += weight;
    else missing.push(key);
  });
  return { score, missing, strong: score >= 70 };
};

// Minimum required fields for a "ready" candidate profile
export const CANDIDATE_MIN_REQUIRED = ["headline", "city", "preferred_roles", "skills", "availability"];

export const isCandidateReadyToApply = (profile) => {
  if (!profile) return false;
  return CANDIDATE_MIN_REQUIRED.every((key) => {
    const w = CANDIDATE_WEIGHTS.find((x) => x.key === key);
    return w?.check(profile);
  });
};

// ─── Organization (Employer) ──────────────────────────────────────────────────

const ORG_WEIGHTS = [
  { key: "name",          weight: 20, check: (o) => !!o?.name },
  { key: "business_type", weight: 15, check: (o) => !!o?.business_type },
  { key: "city",          weight: 15, check: (o) => !!o?.city },
  { key: "description",   weight: 20, check: (o) => !!o?.description },
  { key: "phone",         weight: 10, check: (o) => !!o?.phone },
  { key: "website",       weight: 5,  check: (o) => !!o?.website },
  { key: "address",       weight: 10, check: (o) => !!o?.address },
  { key: "email",         weight: 5,  check: (o) => !!o?.email },
];

/**
 * @param {object|null} org - organization doc
 * @returns {{ score: number, missing: string[], strong: boolean }}
 */
export const getOrgCompletion = (org) => {
  if (!org) return { score: 0, missing: ORG_WEIGHTS.map((w) => w.key), strong: false };
  let score = 0;
  const missing = [];
  ORG_WEIGHTS.forEach(({ key, weight, check }) => {
    if (check(org)) score += weight;
    else missing.push(key);
  });
  return { score, missing, strong: score >= 65 };
};

export const ORG_MIN_REQUIRED = ["name", "business_type", "city"];

export const isOrgReadyToPost = (org) => {
  if (!org) return false;
  return ORG_MIN_REQUIRED.every((key) => {
    const w = ORG_WEIGHTS.find((x) => x.key === key);
    return w?.check(org);
  });
};

// ─── Color helpers ────────────────────────────────────────────────────────────

export const completionColor = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-red-400";
};

export const completionTextColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 50) return "text-amber-600";
  return "text-red-500";
};