import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { claimDaily, getUser } from '../../utils/database.js';
import { getLevelData } from '../../config.js';
import { unlock } from '../../utils/achievements.js';

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
      const embed = luvEmbed(COLORS.neutral)
        .setTitle(`${EMOJIS.heart} already claimed ✦`)
        .setDescription(
          `you've already picked up today's reward.\n\n` +
          `⏳ come back in **${result.waitH}h ${result.waitM}m** for your next drop. 💌`
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter(footer(client));
      const waitRow = buildButtons(
        { id: 'profile_view', label: 'my profile', emoji: '💫', style: ButtonStyle.Secondary },
        { id: 'rank_view',    label: 'my rank',    emoji: '🏆', style: ButtonStyle.Secondary },
      );
      return message.reply({ embeds: [embed], components: [waitRow] });
    }

    // Achievement check
    const user = getUser(message.author.id);
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

    const embed = luvEmbed(COLORS.primary)
      .setTitle(`${EMOJIS.sparkle} daily reward claimed ✦`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `hey **${message.author.username}** 💌\n\n` +
        `💗 **+${result.hearts} hearts** added\n` +
        `⭐ **+${result.xp} XP** earned\n` +
        `${streakLine}` +
        (leveledUp ? `\n\n🎉 **level up!** you reached **lv${newLevel.level} · ${newLevel.title}** ✦` : '')
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'profile_view',  label: 'my profile', emoji: '💫', style: ButtonStyle.Primary },
      { id: 'daily_card',    label: 'view card',  emoji: '🎴', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
