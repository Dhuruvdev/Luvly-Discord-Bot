import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, COMFORT_MESSAGES } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'comfort',
  aliases: ['lonely'],
  description: 'receive comfort when you need it',
  category: 'midnight',
  usage: 'comfort',

  async execute(message, args, client) {
    const msg = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];

    const text =
      `**﹕ⵌ┆ ${EMOJIS.moon} Hey. You Okay? ꩜ .**\n\n` +
      `> *"${msg}"*`;

    const row = buildButtons(
      { id: 'comfort_more', label: 'i need more',   emoji: '🌙', style: ButtonStyle.Secondary },
      { id: 'comfort_done', label: 'i feel better', emoji: '✨', style: ButtonStyle.Success },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
