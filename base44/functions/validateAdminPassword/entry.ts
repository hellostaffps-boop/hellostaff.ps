Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return Response.json({ error: 'Password required' }, { status: 400 });
    }

    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');
    const superAdminEmail = Deno.env.get('SUPER_ADMIN_EMAIL');
    const { email } = body;

    if (!adminPassword) {
      return Response.json({ error: 'Admin password not configured' }, { status: 500 });
    }

    if (password !== adminPassword) {
      return Response.json({ success: false, error: 'Invalid password' }, { status: 403 });
    }

    // Check email restriction if configured
    if (superAdminEmail && email && email !== superAdminEmail) {
      return Response.json({ success: false, error: 'Email not authorized' }, { status: 403 });
    }

    return Response.json({ success: true, message: 'Password validated' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});