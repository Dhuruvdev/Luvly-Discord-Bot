import { MessageFlags } from 'discord.js';
import { luvContainer } from '../../utils/embeds.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

export default {
  name:        'guilds',
  aliases:     ['listguilds', 'servers', 'lguilds'],
  description: 'list all guilds the bot is in',
  category:    'owner',
  ownerOnly:   true,
  noPrefix:    true,

  async execute(message, args, client) {
    const guildList = [...client.guilds.cache.values()];

    if (!guildList.length) {
      return message.reply({
        flags: CV2,
        components: [luvContainer('> bot is not in any guilds ✦')],
      });
    }

    const page     = Math.max(0, (parseInt(args[0]) || 1) - 1);
    const PER_PAGE = 10;
    const pages    = Math.ceil(guildList.length / PER_PAGE);
    const slice    = guildList.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

    const lines = slice.map(g => {
      const memberCount = g.memberCount ?? '?';
      return `> ⤿  **${g.name}** · \`${g.id}\` · ${memberCount} members`;
    });

    const text =
      `**﹕ⵌ┆  Guild List ꩜ .**\n\n` +
      `${R} **Total guilds:** ${guildList.length}  ·  Page ${page + 1}/${pages}\n\n` +
      lines.join('\n') +
      (pages > 1 ? `\n\n*use \`guilds <page>\` to navigate*` : '');

    await message.reply({ flags: CV2, components: [luvContainer(text)] });
  },
};
