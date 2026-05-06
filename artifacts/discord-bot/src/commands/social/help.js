import {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';

export const HELP_CATEGORIES = {
  social:      { emoji: '❤️',  label: 'Social',      desc: 'profile · card · theme' },
  matchmaking: { emoji: '💌',  label: 'Matchmaking',  desc: 'match · crush · daily' },
  midnight:    { emoji: '🌙',  label: 'Midnight',     desc: 'midnight · comfort · vibe' },
  confession:  { emoji: '🎭',  label: 'Confession',   desc: 'confess · secret · reveal' },
  chemistry:   { emoji: '⚗️',  label: 'Chemistry',    desc: 'chemistry · streak · duo' },
  engagement:  { emoji: '🎮',  label: 'Engagement',   desc: 'rank · xp · level · leaderboard' },
  economy:     { emoji: '💰',  label: 'Economy',      desc: 'balance · work · gamble · fish' },
  ai:          { emoji: '🤖',  label: 'AI',           desc: 'rizz · flirt · vibecheck' },
  safety:      { emoji: '🛡️',  label: 'Safety',       desc: 'report · block · trust' },
  hidden:      { emoji: '🔥',  label: 'Hidden',       desc: 'miss · overthink · ghost · playlist' },
};

export const HELP_PAGE_SIZE = 6;

export function buildHelpCategoryPage(catArg, page, cmds) {
  const cat        = HELP_CATEGORIES[catArg] ?? { emoji: '✦', label: catArg };
  const totalPages = Math.max(1, Math.ceil(cmds.length / HELP_PAGE_SIZE));
  const safePage   = Math.max(0, Math.min(page, totalPages - 1));
  const slice      = cmds.slice(safePage * HELP_PAGE_SIZE, (safePage + 1) * HELP_PAGE_SIZE);

  const cmdLines = slice.map(c => {
    const aliases = c.aliases?.length
      ? c.aliases.map(a => `\`luv ${a}\``).join('  ·  ')
      : '';
    return `> ⤿  \`luv ${c.name}\`${aliases ? '  ·  ' + aliases : ''}`;
  }).join('\n');

  const content =
    `**﹕ⵌ┆ ${cat.emoji} ${cat.label} ꩜ .**\n\n` +
    (totalPages > 1 ? `\`\`\`                                    Page ${safePage + 1} / ${totalPages}\`\`\`\n` : '') +
    `**Interact, express & connect with others.ᐟ **\n\n` +
    `<:right:1501255316350959858> **${cat.label} Commands:**\n` +
    (cmdLines || '> *no commands found*') + '\n\n' +
    `<:right:1501255316350959858> **Use these to make chats more fun & lively!**`;

  const container = new ContainerBuilder()
    .setAccentColor(0xFF6B9D)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));

  if (totalPages > 1) {
    const prevBtn = new ButtonBuilder()
      .setCustomId(`help_page:${catArg}:${safePage - 1}`)
      .setLabel('Prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage === 0);

    const nextBtn = new ButtonBuilder()
      .setCustomId(`help_page:${catArg}:${safePage + 1}`)
      .setLabel('Next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage === totalPages - 1);

    const row = new ActionRowBuilder().addComponents(prevBtn, nextBtn);
    container.addActionRowComponents(row);
  }

  return { container, totalPages, safePage };
}

export default {
  name: 'help',
  aliases: ['h', 'commands', 'cmd'],
  description: 'show all commands',
  category: 'social',
  usage: 'help [category]',

  async execute(message, args, client) {
    const catArg = args[0]?.toLowerCase();

    // ── Direct category lookup ─────────────────────────────────────────────────
    if (catArg && HELP_CATEGORIES[catArg]) {
      const cmds = [...client.commands.values()].filter(c => c.category === catArg);
      const { container } = buildHelpCategoryPage(catArg, 0, cmds);

      const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help_category')
          .setPlaceholder('Browse another category...')
          .addOptions(
            Object.entries(HELP_CATEGORIES).map(([key, c]) => ({
              label: c.label, description: c.desc, value: key, emoji: c.emoji,
            }))
          )
      );

      return await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container, selectRow],
      });
    }

    // ── Main help menu ─────────────────────────────────────────────────────────
    const mainText =
      '<:luvly:1501269739324838151>**﹕ⵌ┆ Luvly Help ꩜ .**\n\n' +
      '**Explore all my features & commands to enhance your server experience.ᐟ **\n' +
      '**From fun interactions to useful tools, everything is designed to keep your server active, engaging, and truly luvly.ᐟ**\n\n' +
      '> **Try **  `luv exp`\n' +
      '> **Developer **⤿ [Falooda](https://discord.com/users/1354287041772392478)\n\n' +
      '<:right:1501255316350959858> **Categories:**\n' +
      '> ⤿  __Fun__\n' +
      '> ⤿  __Social__\n' +
      '> ⤿  __Utility__\n' +
      '> ⤿  __Safety__\n\n' +
      '<:right:1501255316350959858> **Select a category below to continue!**';

    const container = new ContainerBuilder()
      .setAccentColor(0xFF6B9D)
      .addTextDisplayComponents(new TextDisplayBuilder().setContent(mainText));

    const selectRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('Select a category below to continue!')
        .addOptions(
          Object.entries(HELP_CATEGORIES).map(([key, c]) => ({
            label: c.label, description: c.desc, value: key, emoji: c.emoji,
          }))
        )
    );

    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container, selectRow],
    });
  },
};
