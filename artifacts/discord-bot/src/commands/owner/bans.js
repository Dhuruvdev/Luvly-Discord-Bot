import { MessageFlags } from 'discord.js';
import { luvContainer } from '../../utils/embeds.js';
import { getTable } from '../../utils/store.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

export default {
  name:        'bans',
  aliases:     ['bannedlist', 'banlist', 'bbans'],
  description: 'list all bot-banned users',
  category:    'owner',
  ownerOnly:   true,
  noPrefix:    true,

  async execute(message, args, client) {
    const db   = getTable('bans');
    const list = Object.values(db);

    if (!list.length) {
      return message.reply({
        flags: CV2,
        components: [luvContainer('> no users are currently banned ✦')],
      });
    }

    const lines = list.map(b => {
      const when = new Date(b.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `> ⤿  \`${b.username ?? b.userId}\` · *${b.reason}* · ${when}`;
    });

    const text =
      `**﹕ⵌ┆  Bot Ban List ꩜ .**\n\n` +
      `${R} **Total bans:** ${list.length}\n\n` +
      lines.join('\n');

    await message.reply({ flags: CV2, components: [luvContainer(text)] });
  },
};
