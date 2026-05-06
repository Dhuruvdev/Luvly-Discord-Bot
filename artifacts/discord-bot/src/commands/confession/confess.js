import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'confess',
  aliases: ['secret', 'anon', 'admire'],
  description: 'post an anonymous confession',
  category: 'confession',
  usage: 'confess',
  cooldown: 10_000,

  async execute(message, args, client) {
    const text =
      `**﹕ⵌ┆ ${EMOJIS.confession} Anonymous Confessions ꩜ .**\n\n` +
      `say the thing you've been keeping inside.\n\n` +
      `> *your identity is hidden. your words are safe.*\n` +
      `> *only you can choose to reveal yourself ✦*`;

    const row = buildButtons(
      { id: 'confess_open', label: 'write confession', emoji: '', style: ButtonStyle.Primary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
