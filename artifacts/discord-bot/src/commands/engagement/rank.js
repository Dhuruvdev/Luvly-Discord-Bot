import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, getLevelData, getXpBar, LEVELS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { getUser, getLeaderboard } from '../../utils/database.js';

export default {
  name: 'rank',
  aliases: ['xp', 'level', 'inventory', 'inv'],
  description: 'check your rank and xp',
  category: 'engagement',
  usage: 'rank [@user]',

  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const user = getUser(target.id);
    const { current, next } = getLevelData(user.xp || 0);
    const xpBar = getXpBar(user.xp || 0, current, next);

    const embed = luvEmbed(current.color)
      .setAuthor({ name: `${target.username}'s rank card ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(target.displayAvatarURL({ size: 256, dynamic: true }))
      .addFields(
        { name: `${EMOJIS.rank} rank`, value: `**level ${current.level}**`, inline: true },
        { name: `${EMOJIS.sparkle} title`, value: `*${current.title}*`, inline: true },
        { name: `${EMOJIS.streak} streak`, value: `**${user.streak || 0}** days 🔥`, inline: true },
        { name: `${EMOJIS.fire} xp`, value: `\`${xpBar}\``, inline: false },
        { name: `${EMOJIS.star} total xp`, value: `**${user.xp || 0}** xp`, inline: true },
        { name: next ? 'next level' : 'status', value: next ? `**${next.title}** at ${next.xp} xp` : '**maxed out** ✦', inline: true },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'daily_claim', label: 'claim daily', emoji: '🎁', style: ButtonStyle.Primary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
