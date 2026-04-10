async function getFirebaseAdminIdToken() {
  const apiKey = Deno.env.get("VITE_FIREBASE_API_KEY");
  const email = Deno.env.get("FIREBASE_ADMIN_EMAIL");
  const password = Deno.env.get("FIREBASE_ADMIN_PASSWORD");
  if (!apiKey || !email || !password) throw new Error("Firebase admin credentials not configured.");
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firebase auth failed: ${data.error?.message}`);
  return data.idToken;
}

function parseValue(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return parseInt(v.integerValue);
  if ("timestampValue" in v) return v.timestampValue;
  return null;
}

async function countDemoDocs(projectId, idToken, collectionId) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId }],
          where: { fieldFilter: { field: { fieldPath: "is_demo" }, op: "EQUAL", value: { booleanValue: true } } },
          limit: 500,
        },
      }),
    }
  );
  const data = await res.json();
  const docs = (Array.isArray(data) ? data : []).filter((r) => r.document);
  const batchId = docs[0]?.document?.fields?.demo_batch_id ? parseValue(docs[0].document.fields.demo_batch_id) : null;
  const createdAt = docs[0]?.document?.fields?.created_at ? parseValue(docs[0].document.fields.created_at) : null;
  return { count: docs.length, batch_id: batchId, created_at: createdAt };
}

const DEMO_COLLECTIONS = [
  "users", "candidate_profiles", "employer_profiles", "organizations",
  "organization_members", "jobs", "applications", "application_notes",
  "application_evaluations", "notifications",
];

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_token } = body;

    const adminPassword = Deno.env.get("ADMIN_PANEL_PASSWORD");
    if (!session_token || !adminPassword || session_token !== btoa(adminPassword)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = Deno.env.get("VITE_FIREBASE_PROJECT_ID");
    const idToken = await getFirebaseAdminIdToken();

    const results = await Promise.all(DEMO_COLLECTIONS.map(async (col) => ({ col, ...(await countDemoDocs(projectId, idToken, col)) })));

    const totalCount = results.reduce((sum, r) => sum + r.count, 0);
    const batchId = results.find((r) => r.batch_id)?.batch_id || null;
    const createdAt = results.find((r) => r.created_at)?.created_at || null;
    const counts = {};
    results.forEach((r) => { counts[r.col] = r.count; });

    return Response.json({
      has_demo_data: totalCount > 0,
      batch_id: batchId,
      created_at: createdAt,
      total_records: totalCount,
      counts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});