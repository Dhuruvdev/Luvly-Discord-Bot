import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, OVERTHINK_MESSAGES } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'overthink',
  aliases: [],
  description: 'emotional late-night thoughts generator',
  category: 'hidden',
  usage: 'overthink',

  async execute(message, args, client) {
    const thought = OVERTHINK_MESSAGES[Math.floor(Math.random() * OVERTHINK_MESSAGES.length)];
    addXP(message.author.id, 5);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.moon} Late Night Thought ꩜ .**\n\n` +
      `> *"${thought}"*`;

    const row = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '🌙', style: ButtonStyle.Primary },
      { id: 'midnight_vibe',    label: 'vibe check',    emoji: '✨', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
