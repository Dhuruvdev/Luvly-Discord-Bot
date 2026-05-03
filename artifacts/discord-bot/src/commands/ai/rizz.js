import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, RIZZ_LINES } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';

export default {
  name: 'rizz',
  aliases: ['flirt', 'starter', 'analyze', 'vibecheck'],
  description: 'get an AI-crafted pickup line or vibe check',
  category: 'ai',
  usage: 'rizz [@user]',

  async execute(message, args, client) {
    const target = message.mentions.users.first();
    const line = RIZZ_LINES[Math.floor(Math.random() * RIZZ_LINES.length)];
    addXP(message.author.id, 3);

    const embed = luvEmbed(COLORS.aura)
      .setTitle(`${EMOJIS.rizz} rizz generator ✦`)
      .setDescription(target
        ? `sending this one to **${target.username}** ✦\n\n*"${line}"*`
        : `*"${line}"*`
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'rizz_new', label: 'new line', emoji: '🔄', style: ButtonStyle.Secondary },
      { id: 'rizz_copy', label: 'use this', emoji: '💌', style: ButtonStyle.Primary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
