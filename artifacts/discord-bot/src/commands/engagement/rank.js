import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, getLevelData, getXpBar } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { getUser, getHearts } from '../../utils/database.js';

export default {
  name: 'rank',
  aliases: ['xp', 'level'],
  description: 'check your rank and xp',
  category: 'engagement',
  usage: 'rank [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.first() ?? message.author;
    const user   = getUser(target.id);
    const hearts = getHearts(target.id);
    const { current, next } = getLevelData(user.xp ?? 0);
    const xpBar = getXpBar(user.xp ?? 0, current, next);

    const embed = luvEmbed(current.color)
      .setAuthor({ name: `${target.username}'s rank ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(target.displayAvatarURL({ size: 256, dynamic: true }))
      .addFields(
        { name: `${EMOJIS.rank} level`,    value: `**${current.level}**`,                   inline: true },
        { name: `${EMOJIS.sparkle} title`, value: `*${current.title}*`,                     inline: true },
        { name: `${EMOJIS.streak} streak`, value: `**${user.streak ?? 0}** days 🔥`,         inline: true },
        { name: `${EMOJIS.fire} progress`, value: `\`${xpBar}\``,                           inline: false },
        { name: `${EMOJIS.heart} hearts`,  value: `**${hearts}** 💗`,                        inline: true },
        { name: 'total xp',               value: `**${user.xp ?? 0}**`,                     inline: true },
        {
          name:  next ? 'next level' : 'status',
          value: next
            ? `**${next.title}** at ${next.xp.toLocaleString()} xp`
            : '**max level** 👑',
          inline: true,
        },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'daily_claim', label: 'claim daily', emoji: '🎁', style: ButtonStyle.Primary },
      { id: 'shop_open',   label: 'open shop',   emoji: '💗', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
