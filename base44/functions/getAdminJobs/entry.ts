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
    const [jobs, apps] = await Promise.all([
      base44.asServiceRole.entities.Job.list('-created_date', 500),
      base44.asServiceRole.entities.Application.list('-created_date', 500),
    ]);

    return Response.json({ jobs, applications: apps });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});