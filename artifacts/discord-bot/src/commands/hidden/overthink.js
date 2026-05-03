import { COLORS, EMOJIS, OVERTHINK_MESSAGES } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { ButtonStyle } from 'discord.js';
import { addXP } from '../../utils/database.js';

export default {
  name: 'overthink',
  aliases: [],
  description: 'emotional late-night thoughts generator',
  category: 'hidden',
  usage: 'overthink',

  async execute(message, args, client) {
    const thought = OVERTHINK_MESSAGES[Math.floor(Math.random() * OVERTHINK_MESSAGES.length)];
    addXP(message.author.id, 5);

    const embed = luvEmbed(COLORS.midnight)
      .setTitle(`${EMOJIS.moon} late night thought ✦`)
      .setDescription(`*"${thought}"*`)
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '🌙', style: ButtonStyle.Primary },
      { id: 'midnight_vibe', label: 'vibe check', emoji: '✨', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
