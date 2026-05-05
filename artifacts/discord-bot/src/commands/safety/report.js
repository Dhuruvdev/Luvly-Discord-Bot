import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, errorEmbed, footer } from '../../utils/embeds.js';
import { blockUser } from '../../utils/database.js';

export default {
  name: 'report',
  aliases: ['block', 'safety', 'trust', 'verify'],
  description: 'report or block a user',
  category: 'safety',
  usage: 'report @user [reason] | block @user',
  cooldown: 10_000,

  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report or block a user in Luvly')
    .addStringOption(o =>
      o.setName('action')
        .setDescription('What to do')
        .setRequired(true)
        .addChoices(
          { name: 'report — flag this user for review', value: 'report' },
          { name: 'block — stop all Luvly interactions', value: 'block' },
        )
    )
    .addUserOption(o =>
      o.setName('user').setDescription('User to report or block').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('reason').setDescription('Reason (for reports)')
    ),

  async execute(message, args, client) {
    const sub    = args[0]?.toLowerCase();
    const target = message.mentions.users.first();

    // Safety info (no target)
    if (!target && sub !== 'block') {
      const embed = luvEmbed(COLORS.primary)
        .setTitle(`${EMOJIS.safety} safety center ✦`)
        .setDescription(
          '**how to use:**\n' +
          '`u report @user [reason]` — report someone\n' +
          '`u block @user` — block all interactions\n\n' +
          '> *all reports are confidential and reviewed by server staff ✦*'
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (!target) return await message.reply({ embeds: [errorEmbed('mention a user ✦')] });
    if (target.id === message.author.id) return await message.reply({ embeds: [errorEmbed("you can't report yourself 💀")] });

    // Block
    if (sub === 'block') {
      blockUser(message.author.id, target.id);
      const embed = luvEmbed(COLORS.neutral)
        .setDescription(`${EMOJIS.lock} **${target.username}** has been blocked. you won't see each other in luvly anymore ✦`)
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    // Report
    const reason = args.slice(1).join(' ').replace(/<@!?\d+>/g, '').trim() || 'no reason provided';

    const embed = luvEmbed(COLORS.error)
      .setTitle(`${EMOJIS.safety} report submitted ✦`)
      .setDescription(
        `your report against **${target.username}** has been noted.\n` +
        `> *"${reason}"*\n\n` +
        'thank you for helping keep luvly safe ✦'
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });

    // Log to mod channel if exists
    try {
      const modLog = message.guild?.channels?.cache?.find(
        c => ['mod-log', 'logs', 'mod-logs', 'server-logs'].includes(c.name)
      );
      if (modLog) {
        const logEmbed = luvEmbed(COLORS.error)
          .setTitle('⚠️ safety report')
          .addFields(
            { name: 'reporter', value: `${message.author.tag ?? message.author.username} (${message.author.id})`, inline: true },
            { name: 'reported', value: `${target.tag ?? target.username} (${target.id})`,                         inline: true },
            { name: 'reason',   value: reason },
          )
          .setTimestamp();
        await modLog.send({ embeds: [logEmbed] });
      }
    } catch {}
  },
};
