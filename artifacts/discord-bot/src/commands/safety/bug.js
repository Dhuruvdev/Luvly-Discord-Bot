import {
  ButtonStyle, MessageFlags,
  ActionRowBuilder, ButtonBuilder,
  ContainerBuilder, TextDisplayBuilder,
} from 'discord.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name:        'bug',
  aliases:     ['bugreport', 'reportbug', 'feedback'],
  description: 'report a bug or issue with the bot',
  category:    'safety',
  cooldown:    15_000,

  async execute(message, args, client) {
    const container = new ContainerBuilder().setAccentColor(0x26272F);

    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**﹕ⵌ┆ 🐛 Bug Report ꩜ .**\n\n` +
        `**Found something broken? Let us know.ᐟ **\n\n` +
        `➜ **Report Details:**\n` +
        `> ⤿  __Command used__  \n` +
        `> ⤿  __What happened__  \n` +
        `> ⤿  __Expected result__  \n` +
        `> ⤿  __Screenshot (if any)__  \n\n` +
        `➜ **Send your report below**`
      )
    );

    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('bug_report_open')
          .setLabel('🐛 Report Bug')
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await message.reply({ flags: CV2, components: [container] });
  },
};
