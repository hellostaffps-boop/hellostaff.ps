/**
 * rateLimiter.js — Client-side rate limiting utility.
 * Prevents spam by tracking action timestamps per key.
 */

const actionTimestamps = {};

/**
 * Check if an action is rate-limited.
 * @param {string} key - Unique identifier for the action (e.g., "apply:job123")
 * @param {number} cooldownMs - Cooldown period in milliseconds (default: 5000ms)
 * @param {number} maxActions - Max actions allowed in the window (default: 1)
 * @returns {{ allowed: boolean, remainingMs: number }}
 */
export function checkRateLimit(key, cooldownMs = 5000, maxActions = 1) {
  const now = Date.now();
  
  if (!actionTimestamps[key]) {
    actionTimestamps[key] = [];
  }

  // Clean old timestamps outside the cooldown window
  actionTimestamps[key] = actionTimestamps[key].filter(t => now - t < cooldownMs);

  if (actionTimestamps[key].length >= maxActions) {
    const oldestInWindow = actionTimestamps[key][0];
    const remainingMs = cooldownMs - (now - oldestInWindow);
    return { allowed: false, remainingMs };
  }

  actionTimestamps[key].push(now);
  return { allowed: true, remainingMs: 0 };
}

/**
 * Rate-limited wrapper for async functions.
 * @param {string} key - Unique rate limit key
 * @param {Function} fn - The async function to execute
 * @param {number} cooldownMs - Cooldown in ms
 * @returns {Promise} - Result of fn, or throws if rate-limited
 */
export async function withRateLimit(key, fn, cooldownMs = 3000) {
  const { allowed, remainingMs } = checkRateLimit(key, cooldownMs);
  if (!allowed) {
    const seconds = Math.ceil(remainingMs / 1000);
    throw new Error(`Rate limited. Please wait ${seconds} second(s) before trying again.`);
  }
  return fn();
}
