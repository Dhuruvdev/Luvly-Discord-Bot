import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, errorEmbed, footer } from '../../utils/embeds.js';
import { getGhostDays } from '../../utils/database.js';

const GHOST_MSGS = [
  (d) => `you disappeared for **${d} day${d !== 1 ? 's' : ''}**. ghost aura: **rising** 👻`,
  (d) => `${d} days of silence. the chat misses you. or maybe it doesn't. 💀`,
  (d) => `officially ghosting for **${d} day${d !== 1 ? 's' : ''}**. respect. 👻`,
];

export default {
  name: 'ghost',
  aliases: [],
  description: 'check your ghosting behavior',
  category: 'hidden',
  usage: 'ghost [@user]',

  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const days = getGhostDays(target.id);
    const isSelf = target.id === message.author.id;

    if (days === 0) {
      const embed = luvEmbed(COLORS.success)
        .setDescription(`${EMOJIS.ghost} **${target.username}** is not a ghost. they're right here. 💀`)
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    const msgFn = GHOST_MSGS[Math.floor(Math.random() * GHOST_MSGS.length)];
    const ghostLevel = days > 30 ? 'legendary' : days > 14 ? 'serious' : days > 7 ? 'moderate' : 'low';
    const ghostBar = '👻'.repeat(Math.min(Math.ceil(days / 3), 10));

    const embed = luvEmbed(COLORS.neutral)
      .setTitle(`${EMOJIS.ghost} ghost detector ✦`)
      .setAuthor({ name: target.username, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setDescription(msgFn(days))
      .addFields(
        { name: 'ghost level', value: `**${ghostLevel}**`, inline: true },
        { name: 'days silent', value: `**${days}**`, inline: true },
        { name: 'ghost aura', value: ghostBar || '—' },
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });
  },
};
