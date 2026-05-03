import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, errorEmbed, footer } from '../../utils/embeds.js';
import { buildButtons } from '../../utils/embeds.js';
import { ButtonStyle } from 'discord.js';

export default {
  name: 'report',
  aliases: ['block', 'safety', 'trust', 'verify'],
  description: 'safety and trust system',
  category: 'safety',
  usage: 'report @user [reason]',

  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) {
      const embed = luvEmbed(COLORS.primary)
        .setTitle(`${EMOJIS.safety} safety center ✦`)
        .setDescription(
          'luvly is committed to keeping this space safe.\n\n' +
          '**how to use:**\n' +
          '`u report @user [reason]` — report someone\n' +
          '`u block @user` — block interactions\n' +
          '`u verify` — learn about verification\n\n' +
          'all reports are confidential ✦'
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) {
      return await message.reply({ embeds: [errorEmbed('you can\'t report yourself 💀')] });
    }

    const reason = args.slice(1).join(' ') || 'no reason provided';

    const embed = luvEmbed(COLORS.error)
      .setTitle(`${EMOJIS.safety} report submitted ✦`)
      .setDescription(
        `your report against **${target.username}** has been noted.\n\n` +
        `*"${reason}"*\n\n` +
        'reports are reviewed confidentially. thank you for helping keep luvly safe ✦'
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed], ephemeral: false });

    try {
      const modLog = message.guild.channels.cache.find(c => c.name === 'mod-log' || c.name === 'logs');
      if (modLog) {
        const logEmbed = luvEmbed(COLORS.error)
          .setTitle('⚠️ safety report')
          .addFields(
            { name: 'reporter', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'reported', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'reason', value: reason },
          )
          .setTimestamp();
        await modLog.send({ embeds: [logEmbed] });
      }
    } catch {}
  },
};
