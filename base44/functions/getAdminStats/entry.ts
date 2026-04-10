// Helper: get Firebase ID token for admin service account
async function getFirebaseAdminIdToken() {
  const apiKey = Deno.env.get('VITE_FIREBASE_API_KEY');
  const email = Deno.env.get('FIREBASE_ADMIN_EMAIL');
  const password = Deno.env.get('FIREBASE_ADMIN_PASSWORD');
  if (!apiKey || !email || !password) throw new Error('Firebase admin credentials not configured. Set FIREBASE_ADMIN_EMAIL and FIREBASE_ADMIN_PASSWORD.');
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Firebase auth failed: ${data.error?.message}`);
  return data.idToken;
}

function parseValue(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseValue);
  if ('mapValue' in v) { const obj = {}; for (const [k, val] of Object.entries(v.mapValue.fields || {})) obj[k] = parseValue(val); return obj; }
  return null;
}

function parseDoc(doc) {
  if (!doc) return null;
  const parts = doc.name.split('/');
  const id = parts[parts.length - 1];
  const obj = { id };
  for (const [k, v] of Object.entries(doc.fields || {})) obj[k] = parseValue(v);
  return obj;
}

async function firestoreQuery(projectId, idToken, collectionId, limit = 500) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ structuredQuery: { from: [{ collectionId }], limit } }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(`Firestore query failed on ${collectionId}: ${JSON.stringify(data.error || data)}`);
  return (Array.isArray(data) ? data : []).filter(r => r.document).map(r => parseDoc(r.document));
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_token } = body;
    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');
    if (!session_token || !adminPassword || session_token !== btoa(adminPassword)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = Deno.env.get('VITE_FIREBASE_PROJECT_ID');
    const idToken = await getFirebaseAdminIdToken();

    const [users, jobs, apps, orgs] = await Promise.all([
      firestoreQuery(projectId, idToken, 'users', 1000),
      firestoreQuery(projectId, idToken, 'jobs', 1000),
      firestoreQuery(projectId, idToken, 'applications', 1000),
      firestoreQuery(projectId, idToken, 'organizations', 500),
    ]);

    return Response.json({
      totalUsers: users.length,
      totalCandidates: users.filter(u => u.role === 'candidate').length,
      totalEmployers: users.filter(u => ['employer_owner', 'employer_manager'].includes(u.role)).length,
      totalAdmins: users.filter(u => u.role === 'platform_admin').length,
      totalJobs: jobs.length,
      publishedJobs: jobs.filter(j => j.status === 'published').length,
      draftJobs: jobs.filter(j => j.status === 'draft').length,
      closedJobs: jobs.filter(j => j.status === 'closed').length,
      totalApplications: apps.length,
      totalOrganizations: orgs.length,
      verifiedOrgs: orgs.filter(o => o.verified === true).length,
      pendingOrgs: orgs.filter(o => !o.verified).length,
      activeOrgs: orgs.filter(o => o.status === 'active').length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});