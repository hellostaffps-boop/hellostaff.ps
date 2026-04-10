import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_token } = body;
    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');

    if (!session_token || !adminPassword || session_token !== btoa(adminPassword)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const users = await base44.asServiceRole.entities.User.list('-created_date', 500);

    return Response.json({ users });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});