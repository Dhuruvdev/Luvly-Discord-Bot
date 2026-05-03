import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, getLevelData, getXpBar } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { getUser } from '../../utils/database.js';

export default {
  name: 'profile',
  aliases: ['p'],
  description: 'view yours or someone else\'s profile',
  category: 'social',
  usage: 'profile [@user]',

  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const user = getUser(target.id);
    const member = message.guild.members.cache.get(target.id);
    const { current, next } = getLevelData(user.xp || 0);
    const xpBar = getXpBar(user.xp || 0, current, next);
    const auraColors = {
      soft: COLORS.soft, ethereal: COLORS.purple, magnetic: COLORS.primary,
      chaotic: COLORS.rose, midnight: COLORS.midnight, golden: COLORS.gold,
    };

    const embed = luvEmbed(auraColors[user.aura] || COLORS.primary)
      .setAuthor({ name: `${target.username} ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(target.displayAvatarURL({ size: 256, dynamic: true }))
      .setDescription(user.bio ? `*"${user.bio}"*` : '*no bio set yet...*')
      .addFields(
        {
          name: `${EMOJIS.star} aura`,
          value: `**${user.aura || 'soft'}**`,
          inline: true,
        },
        {
          name: `${EMOJIS.sparkle} pronouns`,
          value: user.pronouns || '*not set*',
          inline: true,
        },
        {
          name: `${EMOJIS.rank} level`,
          value: `**${current.level}** — *${current.title}*`,
          inline: true,
        },
        {
          name: `${EMOJIS.fire} xp progress`,
          value: `\`${xpBar}\``,
        },
        {
          name: `${EMOJIS.heart} interests`,
          value: user.interests?.length ? user.interests.map(i => `\`${i}\``).join(' ') : '*none listed*',
        },
        {
          name: `${EMOJIS.streak} streak`,
          value: `**${user.streak || 0}** days`,
          inline: true,
        },
        {
          name: `${EMOJIS.chemistry} total xp`,
          value: `**${user.xp || 0}**`,
          inline: true,
        },
      )
      .setFooter(footer(client));

    const isSelf = target.id === message.author.id;
    const rows = [];

    if (isSelf) {
      rows.push(buildButtons(
        { id: 'profile_edit', label: 'edit profile', emoji: '✏️', style: ButtonStyle.Primary },
        { id: 'profile_aura', label: 'change aura', emoji: '🌸', style: ButtonStyle.Secondary },
      ));
    }

    await message.reply({ embeds: [embed], components: rows });
  },
};
