import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function getPath(file) {
  return join(DATA_DIR, `${file}.json`);
}

function load(file) {
  const path = getPath(file);
  if (!existsSync(path)) return {};
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return {}; }
}

function save(file, data) {
  writeFileSync(getPath(file), JSON.stringify(data, null, 2));
}

// ── Users ────────────────────────────────────────────────────────────────────
export function getUser(userId) {
  const db = load('users');
  if (!db[userId]) {
    db[userId] = {
      id: userId,
      bio: null,
      pronouns: null,
      interests: [],
      theme: 'default',
      badges: [],
      xp: 0,
      streak: 0,
      lastDaily: null,
      lastMessage: null,
      aura: 'soft',
      ghostCount: 0,
      lastSeen: Date.now(),
    };
    save('users', db);
  }
  return db[userId];
}

export function saveUser(userId, data) {
  const db = load('users');
  db[userId] = { ...db[userId], ...data };
  save('users', db);
  return db[userId];
}

export function addXP(userId, amount) {
  const user = getUser(userId);
  user.xp = (user.xp || 0) + amount;
  saveUser(userId, { xp: user.xp });
  return user.xp;
}

// ── Crushes ───────────────────────────────────────────────────────────────────
export function setCrush(userId, targetId) {
  const db = load('crushes');
  db[userId] = { targetId, timestamp: Date.now() };
  save('crushes', db);
}

export function getCrush(userId) {
  const db = load('crushes');
  return db[userId] || null;
}

export function checkMutualCrush(userId, targetId) {
  const db = load('crushes');
  return db[targetId]?.targetId === userId;
}

// ── Chemistry ─────────────────────────────────────────────────────────────────
export function addChemistry(userId, targetId, amount = 1) {
  const db = load('chemistry');
  const key = [userId, targetId].sort().join('_');
  db[key] = (db[key] || 0) + amount;
  save('chemistry', db);
  return db[key];
}

export function getChemistry(userId, targetId) {
  const db = load('chemistry');
  const key = [userId, targetId].sort().join('_');
  return db[key] || 0;
}

export function getTopAdmirer(userId) {
  const db = load('chemistry');
  let best = null, bestVal = 0;
  for (const [key, val] of Object.entries(db)) {
    if (key.includes(userId) && val > bestVal) {
      const other = key.replace(userId, '').replace('_', '');
      if (other) { best = other; bestVal = val; }
    }
  }
  return { userId: best, score: bestVal };
}

// ── Confessions ───────────────────────────────────────────────────────────────
export function addConfession(authorId, text, targetId = null) {
  const db = load('confessions');
  const id = Date.now().toString(36);
  db[id] = { id, authorId, text, targetId, timestamp: Date.now(), revealed: false };
  save('confessions', db);
  return db[id];
}

export function getConfession(id) {
  const db = load('confessions');
  return db[id] || null;
}

export function revealConfession(id) {
  const db = load('confessions');
  if (db[id]) { db[id].revealed = true; save('confessions', db); }
  return db[id];
}

// ── Streaks ───────────────────────────────────────────────────────────────────
export function claimDaily(userId) {
  const user = getUser(userId);
  const now = Date.now();
  const lastDaily = user.lastDaily || 0;
  const hoursSince = (now - lastDaily) / 1000 / 3600;

  if (hoursSince < 20) {
    const waitMs = (20 * 3600 * 1000) - (now - lastDaily);
    const waitH = Math.floor(waitMs / 3600000);
    const waitM = Math.floor((waitMs % 3600000) / 60000);
    return { success: false, waitH, waitM };
  }

  const newStreak = hoursSince < 48 ? (user.streak || 0) + 1 : 1;
  const xpReward = 50 + Math.min(newStreak * 5, 100);

  saveUser(userId, { lastDaily: now, streak: newStreak });
  addXP(userId, xpReward);

  return { success: true, streak: newStreak, xp: xpReward };
}

// ── Matches ───────────────────────────────────────────────────────────────────
export function getLeaderboard(limit = 5) {
  const db = load('users');
  return Object.values(db)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, limit);
}

// ── Ghost tracking ────────────────────────────────────────────────────────────
export function updateLastSeen(userId) {
  const user = getUser(userId);
  saveUser(userId, { lastSeen: Date.now() });
}

export function getGhostDays(userId) {
  const user = getUser(userId);
  if (!user.lastSeen) return 0;
  return Math.floor((Date.now() - user.lastSeen) / (1000 * 60 * 60 * 24));
}
