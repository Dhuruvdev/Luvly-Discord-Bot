/**
 * cooldown.js — Per-command, per-user cooldown + anti-spam system.
 *
 * Uses in-process Maps only — zero disk I/O, zero external deps.
 * Auto-cleans expired entries every 5 minutes to prevent memory leaks.
 */

// ── Command cooldowns ─────────────────────────────────────────────────────────

const cooldowns = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of cooldowns) {
    if (now - ts > 300_000) cooldowns.delete(key);
  }
}, 300_000).unref();

/**
 * Check and set a cooldown.
 * @returns {number} remaining seconds if on cooldown, 0 if clear
 */
export function checkCooldown(userId, commandName, ms) {
  const key  = `${commandName}:${userId}`;
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

// ── Spam gate ──────────────────────────────────────────────────────────────────

const spamTracker = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of spamTracker) {
    if (now - entry.window > 10_000) spamTracker.delete(key);
  }
}, 60_000).unref();

/**
 * Returns true if the user is sending commands too fast.
 * Default: max 4 commands per 3 seconds.
 */
export function isSpamming(userId, windowMs = 3_000, maxCmds = 4) {
  const now   = Date.now();
  const key   = `spam:${userId}`;
  const entry = spamTracker.get(key) ?? { count: 0, window: now };

  if (now - entry.window > windowMs) {
    spamTracker.set(key, { count: 1, window: now });
    return false;
  }

  entry.count++;
  spamTracker.set(key, entry);
  return entry.count > maxCmds;
}

// ── Button debounce ────────────────────────────────────────────────────────────
// Prevents double-click spam on buttons (1.5s window per user per component).

const buttonDebounce = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of buttonDebounce) {
    if (now - ts > 10_000) buttonDebounce.delete(key);
  }
}, 60_000).unref();

/**
 * Returns true if this user + component ID is within the debounce window.
 * Automatically sets the timestamp on first call.
 * @param {number} windowMs - debounce window (default 1500ms)
 */
export function isButtonDebounced(userId, componentId, windowMs = 1_500) {
  // Strip dynamic parts from IDs to group variants (e.g. tlg:0:123 and tlg:1:123 are different pages)
  const key = `${userId}:${componentId}`;
  const now = Date.now();
  const last = buttonDebounce.get(key) ?? 0;
  if (now - last < windowMs) return true;
  buttonDebounce.set(key, now);
  return false;
}
