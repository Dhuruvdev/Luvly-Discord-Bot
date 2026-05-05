import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';

export default {
  name: 'miss',
  aliases: [],
  description: "who's on your mind tonight?",
  category: 'hidden',
  usage: 'miss',

  async execute(message, args, client) {
    addXP(message.author.id, 5);

    const embed = luvEmbed(COLORS.rose)
      .setTitle(`${EMOJIS.heart} who's on your mind tonight?`)
      .setDescription(
        "you don't have to say their name out loud.\n" +
        '> *but luvly already knows someone has your heart right now ✦*\n\n' +
        '*press below to say something. just for you.*'
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '💌', style: ButtonStyle.Primary },
      { id: 'comfort_more',     label: 'comfort me',    emoji: '🌙', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
