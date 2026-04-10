async function getFirebaseAdminIdToken() {
  const apiKey = Deno.env.get('VITE_FIREBASE_API_KEY');
  const email = Deno.env.get('FIREBASE_ADMIN_EMAIL');
  const password = Deno.env.get('FIREBASE_ADMIN_PASSWORD');
  if (!apiKey || !email || !password) throw new Error('Firebase admin credentials not configured.');
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

    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'users' }],
            orderBy: [{ field: { fieldPath: 'created_at' }, direction: 'DESCENDING' }],
            limit: 500,
          }
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(`Firestore error: ${JSON.stringify(data.error || data)}`);

    const users = (Array.isArray(data) ? data : [])
      .filter(r => r.document)
      .map(r => parseDoc(r.document));

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});