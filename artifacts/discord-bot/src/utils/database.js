/**
 * Database v2 — backed by in-memory store with write-through flush.
 * All mutations happen in RAM. Disk is written every 10s via store.js.
 * Zero disk I/O on hot paths.
 */

import { getTable, markDirty } from './store.js';
import { getLevelData } from '../config.js';

// ── User schema default ───────────────────────────────────────────────────────
function defaultUser(userId) {
  return {
    id: userId,
    bio: null,
    pronouns: null,
    interests: [],
    theme: 'default',
    badges: [],
    xp: 0,
    hearts: 0,
    streak: 0,
    lastDaily: null,
    lastSeen: null,
    aura: 'soft',
    profileViews: 0,
    rizzCount: 0,
    ghostCalls: 0,
    createdAt: Date.now(),
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────
export function getUser(userId) {
  const db = getTable('users');
  if (!db[userId]) {
    db[userId] = defaultUser(userId);
    markDirty('users');
  }
  return db[userId];
}

export function saveUser(userId, patch) {
  const db = getTable('users');
  db[userId] = { ...db[userId], ...patch };
  markDirty('users');
  return db[userId];
}

/**
 * Add XP. Returns { oldXP, newXP }.
 */
export function addXP(userId, amount) {
  const db   = getTable('users');
  const user = db[userId] ?? defaultUser(userId);
  const old  = user.xp ?? 0;
  user.xp    = old + amount;
  db[userId] = user;
  markDirty('users');
  return { oldXP: old, newXP: user.xp };
}

// ── Hearts (currency) ─────────────────────────────────────────────────────────
export function addHearts(userId, amount) {
  const db   = getTable('users');
  const user = db[userId] ?? defaultUser(userId);
  user.hearts = (user.hearts ?? 0) + amount;
  db[userId]  = user;
  markDirty('users');
  return user.hearts;
}

export function spendHearts(userId, amount) {
  const db   = getTable('users');
  const user = db[userId] ?? defaultUser(userId);
  if ((user.hearts ?? 0) < amount) return false;
  user.hearts -= amount;
  db[userId]  = user;
  markDirty('users');
  return true;
}

export function getHearts(userId) {
  return getTable('users')[userId]?.hearts ?? 0;
}

// ── Crushes ───────────────────────────────────────────────────────────────────
export function setCrush(userId, targetId) {
  const db = getTable('crushes');
  db[userId] = { targetId, timestamp: Date.now() };
  markDirty('crushes');
}

export function getCrush(userId) {
  return getTable('crushes')[userId] ?? null;
}

export function checkMutualCrush(userId, targetId) {
  return getTable('crushes')[targetId]?.targetId === userId;
}

// ── Chemistry ─────────────────────────────────────────────────────────────────
export function addChemistry(userId, targetId, amount = 1) {
  const db  = getTable('chemistry');
  const key = [userId, targetId].sort().join('_');
  db[key]   = Math.min((db[key] ?? 0) + amount, 200);
  markDirty('chemistry');
  return db[key];
}

export function getChemistry(userId, targetId) {
  const key = [userId, targetId].sort().join('_');
  return getTable('chemistry')[key] ?? 0;
}

export function getTopAdmirer(userId) {
  const db = getTable('chemistry');
  let best = null, bestVal = 0;
  for (const [key, val] of Object.entries(db)) {
    if (!key.includes(userId)) continue;
    const parts = key.split('_');
    // key format: "id1_id2" where both are snowflakes (numeric strings)
    const other = parts[0] === userId ? parts[1] : parts[0];
    if (other && val > bestVal) { best = other; bestVal = val; }
  }
  return { userId: best, score: bestVal };
}

// ── Confessions ───────────────────────────────────────────────────────────────
export function addConfession(authorId, text, targetName = null) {
  const db = getTable('confessions');
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  db[id]   = { id, authorId, text, targetName, timestamp: Date.now(), revealed: false };
  markDirty('confessions');
  return db[id];
}

export function getConfession(id) {
  return getTable('confessions')[id] ?? null;
}

export function revealConfession(id) {
  const db = getTable('confessions');
  if (db[id]) { db[id].revealed = true; markDirty('confessions'); }
  return db[id];
}

// ── Daily / Streaks ───────────────────────────────────────────────────────────
export function claimDaily(userId) {
  const user = getUser(userId);
  const now  = Date.now();
  const last = user.lastDaily ?? 0;
  const hoursSince = (now - last) / 3_600_000;

  if (hoursSince < 20) {
    const waitMs = (20 * 3_600_000) - (now - last);
    return {
      success: false,
      waitH: Math.floor(waitMs / 3_600_000),
      waitM: Math.floor((waitMs % 3_600_000) / 60_000),
    };
  }

  const newStreak = hoursSince < 48 ? (user.streak ?? 0) + 1 : 1;
  const xpReward  = 50 + Math.min(newStreak * 5, 100);
  const heartBonus = newStreak >= 7 ? 10 : newStreak >= 3 ? 5 : 2;

  saveUser(userId, { lastDaily: now, streak: newStreak });
  const { oldXP, newXP } = addXP(userId, xpReward);
  addHearts(userId, heartBonus);

  return { success: true, streak: newStreak, xp: xpReward, hearts: heartBonus, oldXP, newXP };
}

// ── Leaderboard ───────────────────────────────────────────────────────────────
export function getLeaderboard(limit = 5) {
  return Object.values(getTable('users'))
    .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
    .slice(0, limit);
}

// ── Ghost ─────────────────────────────────────────────────────────────────────
export function updateLastSeen(userId) {
  const db = getTable('users');
  if (!db[userId]) db[userId] = defaultUser(userId);
  db[userId].lastSeen = Date.now();
  markDirty('users');
}

export function getGhostDays(userId) {
  const last = getTable('users')[userId]?.lastSeen;
  if (!last) return 0;
  return Math.floor((Date.now() - last) / 86_400_000);
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export function getInventory(userId) {
  return getTable('inventory')[userId] ?? {};
}

export function addItem(userId, itemId, qty = 1) {
  const db  = getTable('inventory');
  if (!db[userId]) db[userId] = {};
  db[userId][itemId] = (db[userId][itemId] ?? 0) + qty;
  markDirty('inventory');
  return db[userId][itemId];
}

export function useItem(userId, itemId) {
  const db  = getTable('inventory');
  const inv = db[userId] ?? {};
  if (!inv[itemId] || inv[itemId] < 1) return false;
  inv[itemId]--;
  if (inv[itemId] === 0) delete inv[itemId];
  db[userId] = inv;
  markDirty('inventory');
  return true;
}

// ── Blocked list ──────────────────────────────────────────────────────────────
export function blockUser(userId, targetId) {
  const db = getTable('blocks');
  if (!db[userId]) db[userId] = [];
  if (!db[userId].includes(targetId)) {
    db[userId].push(targetId);
    markDirty('blocks');
  }
}

export function isBlocked(userId, targetId) {
  const db = getTable('blocks');
  return (db[userId] ?? []).includes(targetId) ||
         (db[targetId] ?? []).includes(userId);
}
