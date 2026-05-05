import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, errorEmbed, footer } from '../../utils/embeds.js';
import { getGhostDays, getUser, saveUser } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';

const GHOST_MSGS = [
  (d) => `you disappeared for **${d} day${d !== 1 ? 's' : ''}**. ghost aura: **rising** 👻`,
  (d) => `**${d} days** of silence. the chat misses you. or maybe it doesn't. 💀`,
  (d) => `officially ghosting for **${d} day${d !== 1 ? 's' : ''}**. the respect is immaculate. 👻`,
];

export default {
  name: 'ghost',
  aliases: [],
  description: 'check how long someone has been ghosting',
  category: 'hidden',
  usage: 'ghost [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.first() ?? message.author;
    const days   = getGhostDays(target.id);

    if (days === 0) {
      const embed = luvEmbed(COLORS.success)
        .setDescription(`${EMOJIS.ghost} **${target.username}** is not a ghost. they're right here 💀`)
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (target.id !== message.author.id) {
      const caller = getUser(message.author.id);
      const count  = (caller.ghostCalls ?? 0) + 1;
      saveUser(message.author.id, { ghostCalls: count });
      if (count >= 3) await unlock(message.author.id, 'ghost_hunter', client);
    }

    const ghostLevel = days > 30 ? 'legendary' : days > 14 ? 'serious' : days > 7 ? 'moderate' : 'low';
    const ghostBar   = '👻'.repeat(Math.min(Math.ceil(days / 3), 10));
    const msgFn      = GHOST_MSGS[Math.floor(Math.random() * GHOST_MSGS.length)];

    const embed = luvEmbed(COLORS.neutral)
      .setTitle(`${EMOJIS.ghost} ghost detector ✦`)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setDescription(msgFn(days))
      .addFields(
        { name: 'ghost level', value: `**${ghostLevel}**`, inline: true },
        { name: 'days silent', value: `**${days}**`,       inline: true },
        { name: 'ghost aura',  value: ghostBar || '—',     inline: false },
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });
  },
};
