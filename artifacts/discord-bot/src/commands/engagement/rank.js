import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, getLevelData, getXpBar } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getUser, getHearts } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'rank',
  aliases: ['xp', 'level'],
  description: 'check your rank and xp',
  category: 'engagement',
  usage: 'rank [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const user   = getUser(target.id);
    const hearts = getHearts(target.id);
    const { current, next } = getLevelData(user.xp ?? 0);
    const xpBar = getXpBar(user.xp ?? 0, current, next);

    const nextStr = next
      ? `**${next.title}** at ${next.xp.toLocaleString()} xp`
      : '**max level** ';

    const text =
      `**﹕ⵌ┆ ${EMOJIS.rank} ${target.username}'s Rank ꩜ .**\n\n` +
      `${R} **Level & Title:**\n` +
      `> ⤿  Level: **${current.level}** — *${current.title}*\n` +
      `> ⤿  Progress: \`${xpBar}\`\n` +
      `> ⤿  Total XP: **${user.xp ?? 0}**\n` +
      `> ⤿  Next: ${nextStr}\n\n` +
      `${R} **Stats:**\n` +
      `> ⤿  Hearts: **${hearts}** \n` +
      `> ⤿  Streak: **${user.streak ?? 0}** days `;

    const row = buildButtons(
      { id: 'daily_claim', label: 'claim daily', emoji: '', style: ButtonStyle.Primary },
      { id: 'shop_open',   label: 'open shop',   emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
