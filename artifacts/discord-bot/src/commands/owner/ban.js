import { MessageFlags } from 'discord.js';
import { luvContainer } from '../../utils/embeds.js';
import { getTable, markDirty } from '../../utils/store.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

export default {
  name:        'ban',
  aliases:     ['botban', 'bban'],
  description: 'ban a user from using the bot',
  category:    'owner',
  ownerOnly:   true,
  noPrefix:    true,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first();

    if (!target) {
      return message.reply({
        flags: CV2,
        components: [luvContainer(`> usage: **ban @user [reason]** ✦`)],
      });
    }

    if (target.id === message.author.id) {
      return message.reply({
        flags: CV2,
        components: [luvContainer(`> you can't ban yourself ✦`)],
      });
    }

    const reason = args.slice(1).join(' ') || 'No reason provided';
    const db     = getTable('bans');
    db[target.id] = {
      userId:    target.id,
      username:  target.username,
      reason,
      bannedBy:  message.author.id,
      timestamp: Date.now(),
    };
    markDirty('bans');

    const text =
      `**﹕ⵌ┆  User Banned ꩜ .**\n\n` +
      `${R} **Target:** \`${target.username}\` (\`${target.id}\`)\n` +
      `${R} **Reason:** ${reason}\n` +
      `${R} **Banned by:** ${message.author.username}\n\n` +
      `*this user can no longer use any bot commands ✦*`;

    await message.reply({ flags: CV2, components: [luvContainer(text)] });
  },
};
