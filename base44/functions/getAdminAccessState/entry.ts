import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: 'Not authenticated', authenticated: false },
        { status: 401 }
      );
    }

    const isAdmin = user.role === 'platform_admin';

    if (isAdmin) {
      // Audit dashboard access
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'admin_dashboard_access',
        actor_uid: user.id,
        actor_email: user.email,
        actor_role: user.role,
        payload_summary: `Admin accessed dashboard`,
        status: 'success',
      });
    }

    return Response.json({
      authenticated: true,
      is_admin: isAdmin,
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      { error: error.message, authenticated: false },
      { status: 500 }
    );
  }
});