import { COLORS, EMOJIS, getLevelData } from '../../config.js';
import { luvEmbed, footer } from '../../utils/embeds.js';
import { getLeaderboard } from '../../utils/database.js';

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default {
  name: 'leaderboard',
  aliases: ['lb', 'top', 'dailyheart'],
  description: 'see the top aura holders',
  category: 'engagement',
  usage: 'leaderboard',

  async execute(message, args, client) {
    const top = getLeaderboard(5);
    if (!top.length) {
      const embed = luvEmbed(COLORS.neutral)
        .setDescription('no data yet. be the first to claim daily xp! ✦')
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    const lines = await Promise.all(
      top.map(async (u, i) => {
        const { current } = getLevelData(u.xp || 0);
        let name = u.id;
        try { const usr = await client.users.fetch(u.id); name = usr.username; } catch {}
        return `${MEDALS[i]}  **${name}**  ·  lv${current.level} *${current.title}*  ·  **${u.xp || 0} xp**`;
      })
    );

    const embed = luvEmbed(COLORS.gold)
      .setTitle(`${EMOJIS.crown} top aura holders ✦`)
      .setDescription(lines.join('\n\n'))
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });
  },
};
