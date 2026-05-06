import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { blockUser } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'report',
  aliases: ['block', 'safety', 'trust', 'verify'],
  description: 'report or block a user',
  category: 'safety',
  usage: 'report @user [reason] | block @user',
  cooldown: 10_000,

  async execute(message, args, client) {
    const sub    = args[0]?.toLowerCase();
    const target = message.mentions.users.filter(u => !u.bot).first();

    const homeRow = buildButtons(
      { id: 'profile_view', label: 'my profile', emoji: '', style: ButtonStyle.Secondary },
      { id: 'daily_claim',  label: 'claim daily', emoji: '', style: ButtonStyle.Primary },
    );

    if (!target && sub !== 'block') {
      const text =
        `**﹕ⵌ┆ ${EMOJIS.safety} Safety Center ꩜ .**\n\n` +
        `${R} **How to use:**\n` +
        `> ⤿  \`u report @user [reason]\` — report someone\n` +
        `> ⤿  \`u block @user\` — block all interactions\n\n` +
        `> *all reports are confidential and reviewed by server staff ✦*`;
      return await message.reply({ flags: CV2, components: [luvContainer(text, homeRow)] });
    }

    if (!target) {
      return await message.reply({ flags: CV2, components: [luvContainer('>  mention a user ✦', homeRow)] });
    }
    if (target.id === message.author.id) {
      return await message.reply({ flags: CV2, components: [luvContainer(" you can't report yourself ", homeRow)] });
    }

    if (sub === 'block') {
      blockUser(message.author.id, target.id);
      const text =
        `**﹕ⵌ┆ ${EMOJIS.lock} User Blocked ꩜ .**\n\n` +
        `**${target.username}** has been blocked. you won't see each other in luvly anymore ✦`;
      return await message.reply({ flags: CV2, components: [luvContainer(text, homeRow)] });
    }

    const reason = args.slice(1).join(' ').replace(/<@!?\d+>/g, '').trim() || 'no reason provided';

    const text =
      `**﹕ⵌ┆ ${EMOJIS.safety} Report Submitted ꩜ .**\n\n` +
      `your report against **${target.username}** has been noted.\n` +
      `> *"${reason}"*\n\n` +
      `thank you for helping keep luvly safe ✦`;

    await message.reply({ flags: CV2, components: [luvContainer(text, homeRow)] });

    try {
      const modLog = message.guild?.channels?.cache?.find(
        c => ['mod-log', 'logs', 'mod-logs', 'server-logs'].includes(c.name)
      );
      if (modLog) {
        const logText =
          ` **Safety Report**\n\n` +
          `${R} **Reporter:** ${message.author.tag ?? message.author.username} (${message.author.id})\n` +
          `${R} **Reported:** ${target.tag ?? target.username} (${target.id})\n` +
          `${R} **Reason:** ${reason}`;
        await modLog.send({ flags: CV2, components: [luvContainer(logText)] });
      }
    } catch {}
  },
};
