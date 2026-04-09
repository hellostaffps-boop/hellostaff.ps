import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json(
        { error: 'Unauthorized', code: 'not_authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return Response.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');
    const superAdminEmail = Deno.env.get('SUPER_ADMIN_EMAIL');

    // Audit failed attempt
    if (password !== adminPassword) {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'admin_password_validation_failure',
        actor_uid: user.id,
        actor_email: user.email,
        actor_role: user.role || 'user',
        payload_summary: `Failed password validation attempt`,
        status: 'failure',
      });

      return Response.json(
        { error: 'Invalid password', code: 'invalid_password' },
        { status: 403 }
      );
    }

    // Check if email is allowed (if configured)
    if (superAdminEmail && user.email !== superAdminEmail) {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'admin_password_validation_failure',
        actor_uid: user.id,
        actor_email: user.email,
        actor_role: user.role || 'user',
        payload_summary: `Email not authorized for admin access`,
        status: 'failure',
      });

      return Response.json(
        { error: 'Not authorized', code: 'unauthorized_email' },
        { status: 403 }
      );
    }

    // Audit successful validation
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'admin_password_validation_success',
      actor_uid: user.id,
      actor_email: user.email,
      actor_role: user.role || 'user',
      payload_summary: `Admin password validated successfully`,
      status: 'success',
    });

    return Response.json({
      success: true,
      user_id: user.id,
      user_email: user.email,
      message: 'Password validated',
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});