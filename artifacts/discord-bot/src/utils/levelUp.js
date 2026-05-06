import { ContainerBuilder, TextDisplayBuilder, MessageFlags } from 'discord.js';
import { getLevelData } from '../config.js';
import { unlock } from './achievements.js';

const ACCENT = 0x26272F;
const CV2    = MessageFlags.IsComponentsV2;

const LEVEL_ACHIEVEMENTS = {
  3: 'level_3',
  5: 'level_5',
  8: 'level_8',
};

export async function checkLevelUp(userId, oldXP, newXP, channel, client) {
  const { current: oldLevel } = getLevelData(oldXP);
  const { current: newLevel } = getLevelData(newXP);

  if (newLevel.level <= oldLevel.level) return;

  if (channel) {
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**﹕ⵌ┆ ✨ Level Up! ꩜ .**\n\n` +
        `<@${userId}> just reached **level ${newLevel.level}** — *${newLevel.title}* ✦`
      ));
    await channel.send({ flags: CV2, components: [container] }).catch(() => {});
  }

  try {
    const user = await client.users.fetch(userId);
    const container = new ContainerBuilder()
      .setAccentColor(ACCENT)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**﹕ⵌ┆ ${newLevel.level === 8 ? '👑' : '✨'} You Leveled Up! ꩜ .**\n\n` +
        `you're now **level ${newLevel.level}** — *${newLevel.title}* ✦\n\n` +
        `keep going. the aura gets stronger from here.`
      ));
    await user.send({ flags: CV2, components: [container] }).catch(() => {});
  } catch {}

  const achId = LEVEL_ACHIEVEMENTS[newLevel.level];
  if (achId) await unlock(userId, achId, client);
}
