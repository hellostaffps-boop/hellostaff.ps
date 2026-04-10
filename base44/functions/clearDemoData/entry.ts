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

async function queryDemoDocs(projectId, idToken, collectionId) {
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
  return (Array.isArray(data) ? data : []).filter((r) => r.document).map((r) => r.document.name);
}

async function batchDelete(projectId, idToken, docNames) {
  if (docNames.length === 0) return;
  const chunks = [];
  for (let i = 0; i < docNames.length; i += 400) chunks.push(docNames.slice(i, i + 400));
  for (const chunk of chunks) {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:batchWrite`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ writes: chunk.map((name) => ({ delete: name })) }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`batchDelete failed: ${JSON.stringify(data.error || data)}`);
  }
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

    const results = {};
    let totalDeleted = 0;

    for (const col of DEMO_COLLECTIONS) {
      const docNames = await queryDemoDocs(projectId, idToken, col);
      await batchDelete(projectId, idToken, docNames);
      results[col] = docNames.length;
      totalDeleted += docNames.length;
    }

    return Response.json({ success: true, deleted: totalDeleted, by_collection: results });
  } catch (error) {
    return Response.json({ error: error.message });
  }
});