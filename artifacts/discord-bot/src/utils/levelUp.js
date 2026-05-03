/**
 * Level-up announcer.
 * Called after any XP addition. Checks if the user crossed a level boundary
 * and sends a DM + optionally posts in the triggering channel.
 */

import { EmbedBuilder } from 'discord.js';
import { COLORS, LEVELS, getLevelData } from '../config.js';
import { unlock } from './achievements.js';

const LEVEL_ACHIEVEMENTS = {
  3: 'level_3',
  5: 'level_5',
  8: 'level_8',
};

/**
 * @param {string}  userId
 * @param {number}  oldXP
 * @param {number}  newXP
 * @param {object}  channel  - discord text channel to announce in (optional)
 * @param {object}  client
 */
export async function checkLevelUp(userId, oldXP, newXP, channel, client) {
  const { current: oldLevel } = getLevelData(oldXP);
  const { current: newLevel } = getLevelData(newXP);

  if (newLevel.level <= oldLevel.level) return;

  // Level-up embed for channel
  if (channel) {
    const embed = new EmbedBuilder()
      .setColor(newLevel.color)
      .setTitle(`✨ level up!`)
      .setDescription(`<@${userId}> just reached **level ${newLevel.level}** — *${newLevel.title}* ✦`)
      .setFooter({ text: 'luvly ✦ keep going' });
    await channel.send({ embeds: [embed] }).catch(() => {});
  }

  // DM notification
  try {
    const user = await client.users.fetch(userId);
    const embed = new EmbedBuilder()
      .setColor(newLevel.color)
      .setTitle(`${newLevel.level === 8 ? '👑' : '✨'} you leveled up!`)
      .setDescription(`you're now **level ${newLevel.level}** — *${newLevel.title}* ✦\n\nkeep going. the aura gets stronger from here.`)
      .setFooter({ text: 'luvly ✦' });
    await user.send({ embeds: [embed] }).catch(() => {});
  } catch {}

  // Achievement check
  const achId = LEVEL_ACHIEVEMENTS[newLevel.level];
  if (achId) await unlock(userId, achId, client);
}
