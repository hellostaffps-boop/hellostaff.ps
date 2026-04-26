import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY FIX (2026-04-27): Only allow a pre-configured super admin email to bootstrap
    const SUPER_ADMIN_EMAIL = Deno.env.get('SUPER_ADMIN_EMAIL');
    if (SUPER_ADMIN_EMAIL && user.email !== SUPER_ADMIN_EMAIL) {
      return Response.json(
        { error: 'Forbidden: Only the super admin can bootstrap admin access' },
        { status: 403 }
      );
    }

    // Check if already admin
    if (user.role === 'platform_admin') {
      return Response.json({
        success: true,
        already_admin: true,
        message: 'User is already platform_admin',
      });
    }

    // Bootstrap: set role to platform_admin
    await base44.auth.updateMe({ role: 'platform_admin' });

    // Audit the bootstrap
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'admin_bootstrap_role_assigned',
      actor_uid: user.id,
      actor_email: user.email,
      actor_role: 'platform_admin',
      target_type: 'user',
      target_id: user.id,
      target_email: user.email,
      payload_summary: `User bootstrapped to platform_admin role`,
      status: 'success',
    });

    return Response.json({
      success: true,
      message: 'Admin access granted',
      user_id: user.id,
      user_email: user.email,
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});
