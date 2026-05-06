import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'miss',
  aliases: [],
  description: "who's on your mind tonight?",
  category: 'hidden',
  usage: 'miss',

  async execute(message, args, client) {
    addXP(message.author.id, 5);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.heart} Who's On Your Mind Tonight? ꩜ .**\n\n` +
      `you don't have to say their name out loud.\n` +
      `> *but luvly already knows someone has your heart right now ✦*\n\n` +
      `*press below to say something. just for you.*`;

    const row = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '', style: ButtonStyle.Primary },
      { id: 'comfort_more',     label: 'comfort me',    emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
