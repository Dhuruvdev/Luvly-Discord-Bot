import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, getLevelData } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { claimDaily } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'daily',
  aliases: ['claim', 'checkin', 'check-in'],
  description: 'claim your daily hearts & XP reward',
  category: 'engagement',
  usage: 'daily',
  cooldown: 0,

  async execute(message, args, client) {
    const result = claimDaily(message.author.id);

    if (!result.success) {
      const text =
        `**﹕ⵌ┆ ${EMOJIS.heart} Already Claimed ꩜ .**\n\n` +
        `you've already picked up today's reward.\n\n` +
        `> ⏳ come back in **${result.waitH}h ${result.waitM}m** for your next drop. 💌`;
      const waitRow = buildButtons(
        { id: 'profile_view', label: 'my profile', emoji: '💫', style: ButtonStyle.Secondary },
        { id: 'rank_view',    label: 'my rank',    emoji: '🏆', style: ButtonStyle.Secondary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, waitRow)] });
    }

    if (result.streak >= 7)  unlock(message.author.id, 'streak_7');
    if (result.streak >= 30) unlock(message.author.id, 'streak_30');

    const { current: oldLevel } = getLevelData(result.oldXP);
    const { current: newLevel } = getLevelData(result.newXP);
    const leveledUp = newLevel.level > oldLevel.level;

    const streakLine = result.streak >= 7
      ? `🔥 **${result.streak} day streak!** you're on fire!`
      : result.streak >= 3
        ? `🔥 **${result.streak} day streak** — keep it up!`
        : `🔥 Day **${result.streak}** streak`;

    const text =
      `**﹕ⵌ┆ ${EMOJIS.sparkle} Daily Reward Claimed ꩜ .**\n\n` +
      `hey **${message.author.username}** 💌\n\n` +
      `${R} **Rewards:**\n` +
      `> ⤿  💗 **+${result.hearts} hearts** added\n` +
      `> ⤿  ⭐ **+${result.xp} XP** earned\n` +
      `> ⤿  ${streakLine}` +
      (leveledUp ? `\n\n${R} **Level Up!**\n> ⤿  🎉 you reached **lv${newLevel.level} · ${newLevel.title}** ✦` : '');

    const row = buildButtons(
      { id: 'profile_view', label: 'my profile', emoji: '💫', style: ButtonStyle.Primary },
      { id: 'daily_card',   label: 'view card',  emoji: '🎴', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
