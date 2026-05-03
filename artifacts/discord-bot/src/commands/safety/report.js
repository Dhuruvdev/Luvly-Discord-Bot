import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, errorEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { blockUser, isBlocked } from '../../utils/database.js';
import { ButtonStyle } from 'discord.js';

export default {
  name: 'report',
  aliases: ['block', 'safety', 'trust', 'verify'],
  description: 'report or block a user',
  category: 'safety',
  usage: 'report @user [reason] | block @user',
  cooldown: 10_000,

  async execute(message, args, client) {
    const sub    = args[0]?.toLowerCase();
    const target = message.mentions.users.first();

    // u block @user
    if (sub === 'block' || message.content.match(/\bu block\b/i)) {
      if (!target) return await message.reply({ embeds: [errorEmbed('mention a user to block ✦')] });
      if (target.id === message.author.id) return await message.reply({ embeds: [errorEmbed('you can\'t block yourself 💀')] });
      blockUser(message.author.id, target.id);
      const embed = luvEmbed(COLORS.neutral)
        .setDescription(`${EMOJIS.lock} **${target.username}** has been blocked. you won't see each other in luvly anymore ✦`)
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (!target) {
      const embed = luvEmbed(COLORS.primary)
        .setTitle(`${EMOJIS.safety} safety center ✦`)
        .setDescription(
          '**how to use:**\n' +
          '`u report @user [reason]` — report someone\n' +
          '`u block @user` — block all interactions\n' +
          '`u verify` — verification info\n\n' +
          'all reports are confidential and reviewed by server staff ✦'
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) return await message.reply({ embeds: [errorEmbed('you can\'t report yourself 💀')] });

    const reason = args.slice(1).join(' ').replace(/<@!?\d+>/g, '').trim() || 'no reason provided';

    const embed = luvEmbed(COLORS.error)
      .setTitle(`${EMOJIS.safety} report submitted ✦`)
      .setDescription(
        `your report against **${target.username}** has been noted.\n` +
        `*"${reason}"*\n\n` +
        'thank you for helping keep luvly safe ✦'
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });

    // attempt to log to a mod-log channel
    try {
      const modLog = message.guild.channels.cache.find(
        c => ['mod-log', 'logs', 'mod-logs', 'server-logs'].includes(c.name)
      );
      if (modLog) {
        const logEmbed = luvEmbed(COLORS.error)
          .setTitle('⚠️ safety report')
          .addFields(
            { name: 'reporter',  value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'reported',  value: `${target.tag} (${target.id})`,                 inline: true },
            { name: 'reason',    value: reason },
            { name: 'channel',   value: `${message.channel}` },
          )
          .setTimestamp();
        await modLog.send({ embeds: [logEmbed] });
      }
    } catch {}
  },
};
