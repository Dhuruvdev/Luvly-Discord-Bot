/**
 * Achievement system — the single biggest retention driver.
 * Awards XP bonuses + hearts + DM notifications on unlock.
 *
 * Add new achievements here; the unlock engine is generic.
 */

import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../config.js';
import { getTable, markDirty } from './store.js';
import { addXP, addHearts } from './database.js';

export const ACHIEVEMENTS = {
  // ── Profile ────────────────────────────────────────────────────────────────
  first_profile: {
    id: 'first_profile', emoji: '🎭',
    name: 'first look',
    desc: 'set up your profile for the first time',
    xp: 50, hearts: 10,
  },
  // ── Matchmaking ────────────────────────────────────────────────────────────
  first_crush: {
    id: 'first_crush', emoji: '💌',
    name: 'catching feelings',
    desc: 'set your first secret crush',
    xp: 75, hearts: 15,
  },
  mutual_crush: {
    id: 'mutual_crush', emoji: '💞',
    name: "it's mutual",
    desc: 'got a mutual crush reveal',
    xp: 200, hearts: 50,
  },
  // ── Streaks ────────────────────────────────────────────────────────────────
  streak_3: {
    id: 'streak_3', emoji: '🔥',
    name: 'on a roll',
    desc: '3-day daily streak',
    xp: 75, hearts: 20,
  },
  streak_7: {
    id: 'streak_7', emoji: '🔥',
    name: 'weekly devotion',
    desc: '7-day daily streak',
    xp: 150, hearts: 50,
  },
  streak_30: {
    id: 'streak_30', emoji: '👑',
    name: 'monthly lover',
    desc: '30-day unbroken daily streak',
    xp: 500, hearts: 200,
  },
  // ── Levels ─────────────────────────────────────────────────────────────────
  level_3: {
    id: 'level_3', emoji: '✨',
    name: 'rising aura',
    desc: 'reached level 3',
    xp: 0, hearts: 25,
  },
  level_5: {
    id: 'level_5', emoji: '🌸',
    name: 'ethereal',
    desc: 'reached level 5',
    xp: 100, hearts: 75,
  },
  level_8: {
    id: 'level_8', emoji: '💎',
    name: 'legendary lover',
    desc: 'reached the max level',
    xp: 0, hearts: 500,
  },
  // ── Chemistry ──────────────────────────────────────────────────────────────
  chem_50: {
    id: 'chem_50', emoji: '⚗️',
    name: 'bonding',
    desc: '50+ chemistry score with someone',
    xp: 75, hearts: 20,
  },
  chem_100: {
    id: 'chem_100', emoji: '⚗️',
    name: 'bonded',
    desc: '100+ chemistry score with someone',
    xp: 150, hearts: 40,
  },
  chem_200: {
    id: 'chem_200', emoji: '💞',
    name: 'inseparable',
    desc: 'maxed out chemistry (200) with someone',
    xp: 300, hearts: 100,
  },
  // ── Confessions ────────────────────────────────────────────────────────────
  confessor: {
    id: 'confessor', emoji: '🎭',
    name: 'open book',
    desc: 'posted your first anonymous confession',
    xp: 75, hearts: 15,
  },
  // ── Hidden / Viral ─────────────────────────────────────────────────────────
  night_owl: {
    id: 'night_owl', emoji: '🦉',
    name: 'night owl',
    desc: 'used midnight mode after 2am',
    xp: 50, hearts: 20,
  },
  ghost_hunter: {
    id: 'ghost_hunter', emoji: '👻',
    name: 'ghost hunter',
    desc: 'called out 3 ghosts',
    xp: 100, hearts: 30,
  },
  rizz_master: {
    id: 'rizz_master', emoji: '💬',
    name: 'rizz master',
    desc: 'generated 25 pickup lines',
    xp: 100, hearts: 35,
  },
  // ── Social ─────────────────────────────────────────────────────────────────
  profile_viewer: {
    id: 'profile_viewer', emoji: '👀',
    name: 'curious soul',
    desc: 'viewed 10 other profiles',
    xp: 50, hearts: 15,
  },
};

/**
 * Try to unlock an achievement for a user.
 * Returns the achievement object if newly unlocked, null if already had it.
 *
 * @param {string} userId
 * @param {string} achievementId
 * @param {import('discord.js').Client} client - used to DM the user
 * @returns {Promise<object|null>}
 */
export async function unlock(userId, achievementId, client) {
  const ach = ACHIEVEMENTS[achievementId];
  if (!ach) return null;

  const db = getTable('achievements');
  if (!db[userId]) db[userId] = [];
  if (db[userId].includes(achievementId)) return null;

  db[userId].push(achievementId);
  markDirty('achievements');

  if (ach.xp > 0)     addXP(userId, ach.xp);
  if (ach.hearts > 0) addHearts(userId, ach.hearts);

  // DM notification
  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setColor(COLORS.gold)
      .setTitle(`${ach.emoji} achievement unlocked!`)
      .addFields(
        { name: ach.name, value: ach.desc, inline: false },
        { name: 'rewards', value: [
          ach.xp     ? `**+${ach.xp} xp**`     : null,
          ach.hearts ? `**+${ach.hearts} 💗 hearts**` : null,
        ].filter(Boolean).join('  ·  '), inline: false },
      )
      .setFooter({ text: 'luvly achievements ✦' });
    await user.send({ embeds: [embed] }).catch(() => {});
  } catch {}

  return ach;
}

/**
 * Get all unlocked achievements for a user.
 */
export function getUserAchievements(userId) {
  const db = getTable('achievements');
  const ids = db[userId] || [];
  return ids.map(id => ACHIEVEMENTS[id]).filter(Boolean);
}

/**
 * Count of unlocked achievements.
 */
export function getAchievementCount(userId) {
  const db = getTable('achievements');
  return (db[userId] || []).length;
}
