import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, getLevelData } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getLeaderboard } from '../../utils/database.js';
import { getAchievementCount } from '../../utils/achievements.js';

const R      = '<:right:1501255316350959858>';
const CV2    = MessageFlags.IsComponentsV2;
const MEDALS = ['', '', '', '4', '5'];

export default {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  description: 'top aura holders',
  category: 'engagement',
  usage: 'leaderboard',
  cooldown: 10_000,

  async execute(message, args, client) {
    const row = buildButtons(
      { id: 'daily_claim', label: 'claim daily', emoji: '', style: ButtonStyle.Primary },
      { id: 'rank_view',   label: 'my rank',     emoji: '', style: ButtonStyle.Secondary },
    );

    const top = getLeaderboard(5);
    if (!top.length) {
      const text =
        `**﹕ⵌ┆ ${EMOJIS.crown} Top Aura Holders ꩜ .**\n\n` +
        `> *no data yet — be the first to claim daily xp ✦*`;
      return await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    const lines = await Promise.all(
      top.map(async (u, i) => {
        const { current } = getLevelData(u.xp ?? 0);
        const achCount    = getAchievementCount(u.id);
        let name = u.id;
        try { const usr = await client.users.fetch(u.id); name = usr.username; } catch {}
        return (
          `${MEDALS[i]}  **${name}**\n` +
          `  lv${current.level} *${current.title}*  ·  **${u.xp ?? 0} xp**  ·  ${u.hearts ?? 0}   ·  ${achCount} `
        );
      })
    );

    const text =
      `**﹕ⵌ┆ ${EMOJIS.crown} Top Aura Holders ꩜ .**\n\n` +
      `${R} **Rankings:**\n\n` +
      lines.join('\n\n');

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
