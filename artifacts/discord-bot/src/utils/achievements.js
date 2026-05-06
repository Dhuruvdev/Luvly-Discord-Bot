import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { getTable, markDirty } from './store.js';
import { addXP, addHearts } from './database.js';

const ACCENT = 0x26272F;
const CV2    = MessageFlags.IsComponentsV2;

export const ACHIEVEMENTS = {
  first_profile: {
    id: 'first_profile', emoji: '',
    name: 'first look',
    desc: 'set up your profile for the first time',
    xp: 50, hearts: 10,
  },
  first_crush: {
    id: 'first_crush', emoji: '',
    name: 'catching feelings',
    desc: 'set your first secret crush',
    xp: 75, hearts: 15,
  },
  mutual_crush: {
    id: 'mutual_crush', emoji: '',
    name: "it's mutual",
    desc: 'got a mutual crush reveal',
    xp: 200, hearts: 50,
  },
  streak_3: {
    id: 'streak_3', emoji: '',
    name: 'on a roll',
    desc: '3-day daily streak',
    xp: 75, hearts: 20,
  },
  streak_7: {
    id: 'streak_7', emoji: '',
    name: 'weekly devotion',
    desc: '7-day daily streak',
    xp: 150, hearts: 50,
  },
  streak_30: {
    id: 'streak_30', emoji: '',
    name: 'monthly lover',
    desc: '30-day unbroken daily streak',
    xp: 500, hearts: 200,
  },
  level_3: {
    id: 'level_3', emoji: '',
    name: 'rising aura',
    desc: 'reached level 3',
    xp: 0, hearts: 25,
  },
  level_5: {
    id: 'level_5', emoji: '',
    name: 'ethereal',
    desc: 'reached level 5',
    xp: 100, hearts: 75,
  },
  level_8: {
    id: 'level_8', emoji: '',
    name: 'legendary lover',
    desc: 'reached the max level',
    xp: 0, hearts: 500,
  },
  chem_50: {
    id: 'chem_50', emoji: '',
    name: 'bonding',
    desc: '50+ chemistry score with someone',
    xp: 75, hearts: 20,
  },
  chem_100: {
    id: 'chem_100', emoji: '',
    name: 'bonded',
    desc: '100+ chemistry score with someone',
    xp: 150, hearts: 40,
  },
  chem_200: {
    id: 'chem_200', emoji: '',
    name: 'inseparable',
    desc: 'maxed out chemistry (200) with someone',
    xp: 300, hearts: 100,
  },
  confessor: {
    id: 'confessor', emoji: '',
    name: 'open book',
    desc: 'posted your first anonymous confession',
    xp: 75, hearts: 15,
  },
  night_owl: {
    id: 'night_owl', emoji: '',
    name: 'night owl',
    desc: 'used midnight mode after 2am',
    xp: 50, hearts: 20,
  },
  ghost_hunter: {
    id: 'ghost_hunter', emoji: '',
    name: 'ghost hunter',
    desc: 'called out 3 ghosts',
    xp: 100, hearts: 30,
  },
  rizz_master: {
    id: 'rizz_master', emoji: '',
    name: 'rizz master',
    desc: 'generated 25 pickup lines',
    xp: 100, hearts: 35,
  },
  profile_viewer: {
    id: 'profile_viewer', emoji: '',
    name: 'curious soul',
    desc: 'viewed 10 other profiles',
    xp: 50, hearts: 15,
  },
};

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

  try {
    const user = await client.users.fetch(userId);
    const rewards = [
      ach.xp     ? `**+${ach.xp} xp**`          : null,
      ach.hearts ? `**+${ach.hearts}  hearts**` : null,
    ].filter(Boolean).join('  ·  ');

    const container = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**﹕ⵌ┆ ${ach.emoji} Achievement Unlocked! ꩜ .**\n\n` +
        `**${ach.name}** — *${ach.desc}*\n\n` +
        `<:right:1501255316350959858> **Rewards:** ${rewards}`
      ));
    await user.send({ flags: CV2, components: [container] }).catch(() => {});
  } catch {}

  return ach;
}

export function getUserAchievements(userId) {
  const db  = getTable('achievements');
  const ids = db[userId] || [];
  return ids.map(id => ACHIEVEMENTS[id]).filter(Boolean);
}

export function getAchievementCount(userId) {
  const db = getTable('achievements');
  return (db[userId] || []).length;
}
