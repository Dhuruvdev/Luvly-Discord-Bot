import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getUserAchievements, ACHIEVEMENTS } from '../../utils/achievements.js';
import { getHearts } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'achievements',
  aliases: ['ach', 'badges'],
  description: 'view your unlocked achievements',
  category: 'engagement',
  usage: 'achievements [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target   = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const unlocked = getUserAchievements(target.id);
    const total    = Object.keys(ACHIEVEMENTS).length;
    const hearts   = getHearts(target.id);
    const pct      = Math.round((unlocked.length / total) * 100);
    const bar      = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));

    const lockedIds = Object.keys(ACHIEVEMENTS).filter(id => !unlocked.find(a => a.id === id));
    const nextHints = lockedIds.slice(0, 3).map(id => {
      const a = ACHIEVEMENTS[id];
      return `> ⤿  ${a.emoji} *${a.name}* — ${a.desc}`;
    });

    const achList = unlocked.length
      ? unlocked.map(a => `> ⤿  ${a.emoji} **${a.name}** — *${a.desc}*`).join('\n')
      : '> *no achievements yet — start exploring luvly ✦*';

    const text =
      `**﹕ⵌ┆ 🏅 ${target.username}'s Achievements ꩜ .**\n\n` +
      `${R} **Unlocked:**\n${achList}\n\n` +
      `${R} **Progress:** \`${bar}\` **${unlocked.length}/${total}** (${pct}%)\n\n` +
      `${R} **Hearts:** **${hearts}** 💗\n\n` +
      `${R} **Up Next:**\n${nextHints.length ? nextHints.join('\n') : '> *all unlocked!* 🏆'}`;

    const row = buildButtons(
      { id: 'daily_claim',  label: 'claim daily', emoji: '🎁', style: ButtonStyle.Primary },
      { id: 'rank_view',    label: 'my rank',     emoji: '🏆', style: ButtonStyle.Secondary },
      { id: 'profile_view', label: 'my profile',  emoji: '💫', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
