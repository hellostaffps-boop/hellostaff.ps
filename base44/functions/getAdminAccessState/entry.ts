Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_token } = body;

    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');

    // Validate the session token (we use the password hash as session token)
    if (!session_token || !adminPassword) {
      return Response.json({ is_admin: false, authenticated: false });
    }

    const isValid = session_token === btoa(adminPassword);

    return Response.json({
      is_admin: isValid,
      authenticated: isValid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ is_admin: false, authenticated: false, error: error.message });
  }
});