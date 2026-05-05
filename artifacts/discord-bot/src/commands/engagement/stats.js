import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, footer } from '../../utils/embeds.js';
import { getTable } from '../../utils/store.js';

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

    const embed = luvEmbed(COLORS.primary)
      .setAuthor({ name: 'luvly bot stats ✦', iconURL: client.user.displayAvatarURL() })
      .addFields(
        { name: `${EMOJIS.heart} users`,            value: `**${users.toLocaleString()}**`,       inline: true },
        { name: `${EMOJIS.match} crushes`,           value: `**${crushes.toLocaleString()}**`,     inline: true },
        { name: `${EMOJIS.chemistry} pairs`,         value: `**${chemPairs.toLocaleString()}**`,   inline: true },
        { name: `${EMOJIS.confession} confessions`,  value: `**${confessions.toLocaleString()}**`, inline: true },
        { name: `${EMOJIS.sparkle} servers`,         value: `**${client.guilds.cache.size}**`,     inline: true },
        { name: '⚡ uptime',                          value: `**${days}d ${hours}h ${minutes}m**`,  inline: true },
        { name: '🧠 memory',                          value: `**${memMB} MB**`,                     inline: true },
        { name: '📦 node',                            value: `**${process.version}**`,              inline: true },
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });
  },
};
