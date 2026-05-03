import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';

export default {
  name: 'premium',
  aliases: ['vip', 'glow', 'theme', 'elite'],
  description: 'view premium features',
  category: 'premium',
  usage: 'premium',

  async execute(message, args, client) {
    const embed = luvEmbed(COLORS.gold)
      .setTitle(`${EMOJIS.diamond} luvly premium ✦`)
      .setDescription('*elevate your experience. unlock the full luvly universe.*')
      .addFields(
        {
          name: `${EMOJIS.aura} profile themes`,
          value: 'animated cards, exclusive aura colors, custom badges',
          inline: false,
        },
        {
          name: `${EMOJIS.match} VIP matchmaking`,
          value: 'advanced compatibility scoring, priority matches, soulmate algorithm',
          inline: false,
        },
        {
          name: `${EMOJIS.chemistry} premium analytics`,
          value: 'detailed chemistry graphs, conversation insights, admirer reports',
          inline: false,
        },
        {
          name: `${EMOJIS.crown} elite aura`,
          value: 'exclusive "elite" title, glowing name highlight, gold border profile',
          inline: false,
        },
        {
          name: `${EMOJIS.sparkle} status`,
          value: '**coming soon** — stay tuned ✦',
          inline: false,
        },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'premium_interest', label: 'notify me', emoji: '💎', style: ButtonStyle.Primary, disabled: false },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
