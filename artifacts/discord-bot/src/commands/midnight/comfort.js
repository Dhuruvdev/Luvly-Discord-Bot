import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, COMFORT_MESSAGES } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';

export default {
  name: 'comfort',
  aliases: ['lonely'],
  description: 'receive comfort when you need it',
  category: 'midnight',
  usage: 'comfort',

  data: new SlashCommandBuilder()
    .setName('comfort')
    .setDescription('Receive soft comfort when you need it most'),

  async execute(message, args, client) {
    const msg = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];

    const embed = luvEmbed(COLORS.soft)
      .setTitle(`${EMOJIS.moon} hey. you okay? ✦`)
      .setDescription(`> *"${msg}"*`)
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'comfort_more', label: 'i need more',   emoji: '🌙', style: ButtonStyle.Secondary },
      { id: 'comfort_done', label: 'i feel better', emoji: '✨', style: ButtonStyle.Success },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
