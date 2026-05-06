import { MessageFlags } from 'discord.js';
import { luvContainer } from '../../utils/embeds.js';
import { getTable } from '../../utils/store.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

export default {
  name:        'listusers',
  aliases:     ['users', 'lusers'],
  description: 'list all registered users',
  category:    'owner',
  ownerOnly:   true,
  noPrefix:    true,

  async execute(message, args, client) {
    const db    = getTable('users');
    const all   = Object.values(db).filter(u => u.setupComplete);
    const bans  = getTable('bans');

    if (!all.length) {
      return message.reply({ flags: CV2, components: [luvContainer('> no registered users yet ✦')] });
    }

    const page     = Math.max(0, (parseInt(args[0]) || 1) - 1);
    const PER_PAGE = 10;
    const pages    = Math.ceil(all.length / PER_PAGE);
    const slice    = all.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

    const lines = slice.map((u, i) => {
      const banned = bans[u.id] ? ' 🚫' : '';
      const name   = u.id;
      return `> ⤿  \`${name}\`${banned}  ·  lv${Math.floor((u.xp ?? 0) / 100) || 1}  ·  ${u.xp ?? 0} xp`;
    });

    const text =
      `**﹕ⵌ┆  Registered Users ꩜ .**\n\n` +
      `${R} **Total:** ${all.length} users  ·  Page ${page + 1}/${pages}\n\n` +
      lines.join('\n') +
      (pages > 1 ? `\n\n*use \`listusers <page>\` to navigate*` : '');

    await message.reply({ flags: CV2, components: [luvContainer(text)] });
  },
};
