/**
 * help.js — Scrollable instruction container with all interactions inside.
 *
 * Design: Everything lives inside a single ContainerBuilder —
 * the text, the category select menu, and the action buttons.
 * This matches the "NQN-style" help embed where the dropdown
 * and buttons are part of the card, not floating beneath it.
 */

import {
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';

// ── Category registry ──────────────────────────────────────────────────────────

export const HELP_CATEGORIES = {
  profile:      { emoji: '',  label: 'Profile',      desc: 'setup · profile · edit · theme'              },
  relationship: { emoji: '',  label: 'Relationship',  desc: 'breakup · propose · marry · relationship'   },
  economy:      { emoji: '',  label: 'Economy',       desc: 'cash · give · shop · gift · buy · inv'      },
  analysis:     { emoji: '',  label: 'Analysis',      desc: 'rank · lb'                                  },
  greeting:     { emoji: '',  label: 'Greeting',      desc: 'welcome'                                    },
  support:      { emoji: '',  label: 'Support',       desc: 'bug · report'                               },
};

// ── Static command definitions ─────────────────────────────────────────────────

export const HELP_COMMANDS = {
  profile: [
    { name: 'setup',   description: 'set up your luvly profile for the first time' },
    { name: 'profile', description: 'view your profile card and stats'              },
    { name: 'edit',    description: 'edit your bio, pronouns, and interests'        },
    { name: 'theme',   description: 'change your profile card theme'                },
  ],
  relationship: [
    { name: 'breakup',      description: 'end your current relationship'           },
    { name: 'propose',      description: 'propose to someone you love'             },
    { name: 'marry',        description: 'confirm and seal a marriage proposal'    },
    { name: 'relationship', description: 'view your current relationship status'   },
  ],
  economy: [
    { name: 'cash',  description: 'check your current luv balance'    },
    { name: 'give',  description: 'send luv currency to another user' },
    { name: 'shop',  description: 'browse the luvly item shop'        },
    { name: 'gift',  description: 'gift an item to someone'           },
    { name: 'buy',   description: 'purchase an item from the shop'    },
    { name: 'inv',   description: 'view your personal inventory'      },
  ],
  analysis: [
    { name: 'rank', description: 'check your level, XP, and title progress' },
    { name: 'lb',   description: 'view the server leaderboard rankings'      },
  ],
  greeting: [
    { name: 'welcome', description: 'send a warm welcome to a new member' },
  ],
  support: [
    { name: 'bug',    description: 'report a bug or issue with the bot'      },
    { name: 'report', description: 'report a user for breaking server rules' },
  ],
};

export const HELP_PAGE_SIZE = 8;

// ── Shared: category select menu (always inside container via row) ─────────────

function makeCategorySelect(placeholder = 'Browse Commands') {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder(placeholder)
      .addOptions(
        Object.entries(HELP_CATEGORIES).map(([key, c]) => {
          const opt = { label: c.label, description: c.desc, value: key };
          if (c.emoji) opt.emoji = c.emoji;
          return opt;
        })
      )
  );
}

// ── Main help container ────────────────────────────────────────────────────────

export function buildHelpMainContainer(client) {
  const botTag = client?.user?.tag ?? 'Luvly';

  const headerText =
    `**﹕ⵌ┆ <:luvly:1501269739324838151> Luvly Help ꩜ .**\n\n` +
    `**Welcome to ${botTag}!**  Everything below is designed to keep your server\n` +
    `active, emotional, and truly luvly.\n\n` +
    `**Prefix:** \`luv \`  ·  **Slash:** \`/\`\n` +
    `**Developer ⤿** [Falooda](https://discord.com/users/1354287041772392478)\n\n` +
    `**<:right:1501255316350959858> Categories at a glance:**\n` +
    Object.entries(HELP_CATEGORIES).map(([, c]) =>
      `> **${c.label}** — *${c.desc}*`
    ).join('\n') +
    `\n\n` +
    `**<:right:1501255316350959858> Pick a category below to explore its commands.**`;

  const container = new ContainerBuilder()
    .setAccentColor(0x26272F);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(headerText)
  );

  try {
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );
  } catch (_) {}

  container.addActionRowComponents(makeCategorySelect('Browse Commands'));

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_quickstart')
        .setLabel('Quick Start')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_edit')
        .setLabel('My Profile')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('daily_claim')
        .setLabel('Daily Claim')
        .setStyle(ButtonStyle.Secondary),
    )
  );

  return container;
}

// ── Category page container ────────────────────────────────────────────────────

export function buildHelpCategoryPage(catArg, page) {
  const cat        = HELP_CATEGORIES[catArg] ?? { emoji: '', label: catArg, desc: '' };
  const cmds       = HELP_COMMANDS[catArg] ?? [];
  const totalPages = Math.max(1, Math.ceil(cmds.length / HELP_PAGE_SIZE));
  const safePage   = Math.max(0, Math.min(page, totalPages - 1));
  const slice      = cmds.slice(safePage * HELP_PAGE_SIZE, (safePage + 1) * HELP_PAGE_SIZE);

  const cmdLines = slice.map(c => {
    const desc = c.description ? `  —  *${c.description}*` : '';
    return `> ⤿  \`luv ${c.name}\`${desc}`;
  }).join('\n');

  const pageIndicator = totalPages > 1
    ? `\`Page ${safePage + 1} / ${totalPages}\`\n\n`
    : '';

  const content =
    `**﹕ⵌ┆ ${cat.label} Commands ꩜ .**\n\n` +
    pageIndicator +
    `**Interact, express & connect with others.ᐟ**\n\n` +
    `**<:right:1501255316350959858> ${cat.label} Commands:**\n` +
    (cmdLines || '> *no commands found in this category*') +
    `\n\n` +
    `**<:right:1501255316350959858> Use these to make chats more fun & lively!**`;

  const container = new ContainerBuilder()
    .setAccentColor(0x26272F);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content)
  );

  try {
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );
  } catch (_) {}

  container.addActionRowComponents(
    makeCategorySelect(`Browsing: ${cat.label}  ·  Pick another...`)
  );

  const navButtons = [
    new ButtonBuilder()
      .setCustomId('help_home')
      .setLabel('Home')
      .setStyle(ButtonStyle.Secondary),
  ];

  if (totalPages > 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`help_page:${catArg}:${safePage - 1}`)
        .setLabel('Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage === 0),
      new ButtonBuilder()
        .setCustomId(`help_page_indicator:${safePage}:${totalPages}`)
        .setLabel(`${safePage + 1} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`help_page:${catArg}:${safePage + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage >= totalPages - 1),
    );
  }

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(...navButtons)
  );

  return { container, totalPages, safePage };
}

// ── Quick-start container ──────────────────────────────────────────────────────

export function buildQuickStartContainer() {
  const content =
    `**﹕ⵌ┆ Quick Start ꩜ .**\n\n` +
    `**Here's everything you need to get going right away.ᐟ**\n\n` +
    `**<:right:1501255316350959858> Essential Commands:**\n` +
    `> ⤿  \`luv setup\` — set up your luvly profile\n` +
    `> ⤿  \`luv profile\` — view your profile card\n` +
    `> ⤿  \`luv cash\` — check your luv balance\n` +
    `> ⤿  \`luv rank\` — check your level and XP\n` +
    `> ⤿  \`luv lb\` — view the server leaderboard\n` +
    `> ⤿  \`luv propose @user\` — propose to someone\n` +
    `> ⤿  \`luv shop\` — browse the item shop\n` +
    `> ⤿  \`luv welcome @user\` — welcome a new member\n` +
    `> ⤿  \`luv report @user\` — report a rule-breaker\n\n` +
    `**<:right:1501255316350959858> Tips:**\n` +
    `> ⤿  All commands use the \`luv \` prefix\n` +
    `> ⤿  Slash commands \`/<cmd>\` also work!\n` +
    `> ⤿  Use \`luv help <category>\` to jump to a section`;

  const container = new ContainerBuilder()
    .setAccentColor(0x26272F);

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(content)
  );

  try {
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
    );
  } catch (_) {}

  container.addActionRowComponents(makeCategorySelect('Browse Commands'));

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_home')
        .setLabel('Back to Help')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('daily_claim')
        .setLabel('Claim Daily')
        .setStyle(ButtonStyle.Success),
    )
  );

  return container;
}

// ── Command export ─────────────────────────────────────────────────────────────

export default {
  name:        'help',
  aliases:     ['h', 'commands', 'cmd'],
  description: 'show all commands',
  category:    'social',
  usage:       'help [category]',

  async execute(message, args, client) {
    const catArg = args[0]?.toLowerCase();

    if (catArg && HELP_CATEGORIES[catArg]) {
      const { container } = buildHelpCategoryPage(catArg, 0);
      return await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });
    }

    const container = buildHelpMainContainer(client);
    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
