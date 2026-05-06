import { MessageFlags } from 'discord.js';
import { luvContainer } from '../../utils/embeds.js';
import { getTable, markDirty } from '../../utils/store.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

export default {
  name:        'unban',
  aliases:     ['botunban', 'bunban'],
  description: 'unban a user from the bot',
  category:    'owner',
  ownerOnly:   true,
  noPrefix:    true,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first()
      ?? (args[0] ? { id: args[0], username: args[0] } : null);

    if (!target) {
      return message.reply({
        flags: CV2,
        components: [luvContainer(`> usage: **unban @user** or **unban <userId>** ✦`)],
      });
    }

    const db = getTable('bans');
    if (!db[target.id]) {
      return message.reply({
        flags: CV2,
        components: [luvContainer(`> \`${target.username ?? target.id}\` is not banned ✦`)],
      });
    }

    const wasUser = db[target.id];
    delete db[target.id];
    markDirty('bans');

    const text =
      `**﹕ⵌ┆  User Unbanned ꩜ .**\n\n` +
      `${R} **User:** \`${wasUser.username ?? target.id}\` (\`${target.id}\`)\n` +
      `${R} **Unbanned by:** ${message.author.username}\n\n` +
      `*they can use bot commands again ✦*`;

    await message.reply({ flags: CV2, components: [luvContainer(text)] });
  },
};
