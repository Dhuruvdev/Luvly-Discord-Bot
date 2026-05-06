import { MessageFlags } from 'discord.js';
import { luvContainer } from '../../utils/embeds.js';
import { getTable } from '../../utils/store.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s % 60}s`);
  return parts.join(' ');
}

export default {
  name:        'botstats',
  aliases:     ['bstats', 'ownerinfo', 'botinfo'],
  description: 'view detailed bot statistics',
  category:    'owner',
  ownerOnly:   true,
  noPrefix:    true,

  async execute(message, args, client) {
    const users    = Object.values(getTable('users'));
    const bans     = Object.values(getTable('bans'));
    const registered = users.filter(u => u.setupComplete).length;
    const guilds   = client.guilds.cache.size;
    const commands = client.commands.size;
    const uptime   = formatUptime(process.uptime() * 1000);
    const mem      = process.memoryUsage();
    const heapMB   = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const rss      = (mem.rss / 1024 / 1024).toFixed(1);
    const ping     = client.ws.ping;

    const text =
      `**﹕ⵌ┆  Bot Statistics ꩜ .**\n\n` +
      `${R} **Bot:**\n` +
      `> ⤿  Tag: **${client.user?.tag ?? 'unknown'}**\n` +
      `> ⤿  ID: \`${client.user?.id ?? 'unknown'}\`\n` +
      `> ⤿  Uptime: **${uptime}**\n` +
      `> ⤿  Ping: **${ping}ms**\n\n` +
      `${R} **Reach:**\n` +
      `> ⤿  Guilds: **${guilds}**\n` +
      `> ⤿  Commands: **${commands}**\n\n` +
      `${R} **Users:**\n` +
      `> ⤿  Total in DB: **${users.length}**\n` +
      `> ⤿  Registered: **${registered}**\n` +
      `> ⤿  Banned: **${bans.length}**\n\n` +
      `${R} **Memory:**\n` +
      `> ⤿  Heap: **${heapMB} MB**\n` +
      `> ⤿  RSS: **${rss} MB**`;

    await message.reply({ flags: CV2, components: [luvContainer(text)] });
  },
};
