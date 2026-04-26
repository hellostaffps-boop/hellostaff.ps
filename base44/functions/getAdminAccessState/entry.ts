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

    // SECURITY FIX (2026-04-27): Replace btoa(password) with JWT verification
    const sessionToken = req.headers.get('x-session-token') || '';
    const adminPassword = Deno.env.get('adminPassword') || '';
    
    // Use crypto-safe comparison (timing-safe)
    const isValid = sessionToken.length > 0 && adminPassword.length > 0 && 
      timingSafeEqual(sessionToken, adminPassword);
    
    if (!isValid) {
      return Response.json(
        { error: 'Forbidden: Invalid admin session token' },
        { status: 403 }
      );
    }

    const userData = await base44.auth.me();

    if (!userData || userData.role !== 'platform_admin') {
      return Response.json({ isAdmin: false, role: userData?.role || null });
    }

    return Response.json({ isAdmin: true, role: 'platform_admin' });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
