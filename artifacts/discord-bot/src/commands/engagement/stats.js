import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getTable } from '../../utils/store.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'stats',
  aliases: ['botstats', 'info'],
  description: 'luvly bot stats',
  category: 'engagement',
  usage: 'stats',
  cooldown: 15_000,

  async execute(message, args, client) {
    const users       = Object.keys(getTable('users')).length;
    const confessions = Object.keys(getTable('confessions')).length;
    const crushes     = Object.keys(getTable('crushes')).length;
    const chemPairs   = Object.keys(getTable('chemistry')).length;
    const uptime      = process.uptime();
    const days    = Math.floor(uptime / 86400);
    const hours   = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const memMB   = Math.round(process.memoryUsage().rss / 1_048_576);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.sparkle} Luvly Bot Stats ꩜ .**\n\n` +
      `${R} **Community:**\n` +
      `> ⤿  ${EMOJIS.heart} Users: **${users.toLocaleString()}**\n` +
      `> ⤿  ${EMOJIS.match} Crushes: **${crushes.toLocaleString()}**\n` +
      `> ⤿  ${EMOJIS.chemistry} Pairs: **${chemPairs.toLocaleString()}**\n` +
      `> ⤿  ${EMOJIS.confession} Confessions: **${confessions.toLocaleString()}**\n` +
      `> ⤿  ${EMOJIS.sparkle} Servers: **${client.guilds.cache.size}**\n\n` +
      `${R} **System:**\n` +
      `> ⤿   Uptime: **${days}d ${hours}h ${minutes}m**\n` +
      `> ⤿   Memory: **${memMB} MB**\n` +
      `> ⤿   Node: **${process.version}**`;

    const row = buildButtons(
      { id: 'daily_claim',  label: 'claim daily', emoji: '', style: ButtonStyle.Primary },
      { id: 'lb_view',      label: 'leaderboard', emoji: '', style: ButtonStyle.Secondary },
      { id: 'profile_view', label: 'my profile',  emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
