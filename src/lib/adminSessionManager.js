// Admin session manager with timeout handling
const SESSION_KEY = 'admin_session';
const LAST_ACTIVITY_KEY = 'admin_last_activity';
const TOKEN_KEY = 'admin_session_token';

export function getAdminSession() {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setAdminSession(sessionData, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    ...sessionData,
    started_at: new Date().toISOString(),
  }));
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  updateLastActivity();
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function updateLastActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, new Date().getTime().toString());
}

export function getSessionExpirationStatus(timeoutMinutes) {
  const session = getAdminSession();
  if (!session) return { expired: true, reason: 'no_session' };

  const lastActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivityStr) return { expired: true, reason: 'no_activity' };

  const lastActivity = parseInt(lastActivityStr, 10);
  const now = new Date().getTime();
  const elapsedMinutes = (now - lastActivity) / (1000 * 60);

  if (elapsedMinutes > timeoutMinutes) {
    clearAdminSession();
    return { expired: true, reason: 'timeout', elapsed_minutes: Math.round(elapsedMinutes) };
  }

  return { expired: false, elapsed_minutes: Math.round(elapsedMinutes) };
}

export function isAdminSessionValid(timeoutMinutes) {
  return !getSessionExpirationStatus(timeoutMinutes).expired;
}