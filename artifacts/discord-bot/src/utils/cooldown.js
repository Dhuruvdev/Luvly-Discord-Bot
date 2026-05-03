/**
 * Per-command, per-user cooldown system.
 * Uses a single in-process Map — no disk I/O, no external deps.
 * Auto-cleans expired entries every 5 minutes to prevent memory leaks.
 */

const cooldowns = new Map();

// auto-clean stale entries
setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of cooldowns) {
    if (now - ts > 300_000) cooldowns.delete(key);
  }
}, 300_000).unref();

/**
 * Check and set a cooldown.
 * @param {string} userId
 * @param {string} commandName
 * @param {number} ms - cooldown duration in milliseconds
 * @returns {number} remaining seconds if on cooldown, 0 if clear
 */
export function checkCooldown(userId, commandName, ms) {
  const key = `${commandName}:${userId}`;
  const now  = Date.now();
  const last = cooldowns.get(key) ?? 0;
  const diff = now - last;
  if (diff < ms) return Math.ceil((ms - diff) / 1000);
  cooldowns.set(key, now);
  return 0;
}

/**
 * Force-clear a user's cooldown on a specific command.
 */
export function clearCooldown(userId, commandName) {
  cooldowns.delete(`${commandName}:${userId}`);
}

/**
 * Per-server spam gate — max N commands per window.
 */
const spamTracker = new Map();

export function isSpamming(userId, windowMs = 3000, maxCmds = 4) {
  const now = Date.now();
  const key = `spam:${userId}`;
  const entry = spamTracker.get(key) ?? { count: 0, window: now };

  if (now - entry.window > windowMs) {
    spamTracker.set(key, { count: 1, window: now });
    return false;
  }

  entry.count++;
  spamTracker.set(key, entry);
  return entry.count > maxCmds;
}
