import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';

export default {
  name: 'confess',
  aliases: ['secret', 'anon', 'admire', 'reveal'],
  description: 'post an anonymous confession',
  category: 'confession',
  usage: 'confess',

  async execute(message, args, client) {
    const embed = luvEmbed(COLORS.purple)
      .setTitle(`${EMOJIS.confession} anonymous confessions ✦`)
      .setDescription(
        'say the thing you\'ve been keeping inside.\n\n' +
        'your identity is hidden. your words are safe.\n' +
        'only you can choose to reveal yourself ✦'
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'confess_open', label: 'write confession', emoji: '🖊️', style: ButtonStyle.Primary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
