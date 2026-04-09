import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'platform_admin') {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get recent audit logs (last 100)
    const logs = await base44.asServiceRole.entities.AuditLog.list(
      '-created_date',
      100
    );

    return Response.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});