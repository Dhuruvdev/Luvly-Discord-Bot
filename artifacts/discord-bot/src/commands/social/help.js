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
  social:      { emoji: '❤️',  label: 'Social',      desc: 'profile · card · theme',             color: 0xF28B82 },
  matchmaking: { emoji: '💌',  label: 'Matchmaking',  desc: 'match · crush · daily',              color: 0xCB8FE8 },
  midnight:    { emoji: '🌙',  label: 'Midnight',     desc: 'midnight · comfort · vibe',          color: 0x8AB4F8 },
  confession:  { emoji: '🎭',  label: 'Confession',   desc: 'confess · secret · reveal',          color: 0xE8A0BF },
  chemistry:   { emoji: '⚗️',  label: 'Chemistry',    desc: 'chemistry · streak · duo',           color: 0x81C995 },
  engagement:  { emoji: '🎮',  label: 'Engagement',   desc: 'rank · xp · level · leaderboard',   color: 0xFDD663 },
  economy:     { emoji: '💰',  label: 'Economy',      desc: 'balance · work · gamble · fish',     color: 0xFCAD70 },
  ai:          { emoji: '🤖',  label: 'AI',           desc: 'rizz · flirt · vibecheck',           color: 0x78D9EC },
  safety:      { emoji: '🛡️',  label: 'Safety',       desc: 'report · block · trust',             color: 0xA8C7FA },
  hidden:      { emoji: '🔥',  label: 'Hidden',       desc: 'miss · overthink · ghost · playlist',color: 0xFF8BCB },
};

export const HELP_PAGE_SIZE = 8;

// ── Shared: category select menu (always inside container via row) ─────────────

function makeCategorySelect(placeholder = 'Browse Commands') {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder(placeholder)
      .addOptions(
        Object.entries(HELP_CATEGORIES).map(([key, c]) => ({
          label:       c.label,
          description: c.desc,
          value:       key,
          emoji:       c.emoji,
        }))
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
    `**Prefix:** \`luv \` or \`u \`  ·  **Slash:** \`/\`\n` +
    `**Developer ⤿** [Falooda](https://discord.com/users/1354287041772392478)\n\n` +
    `**<:right:1501255316350959858> Categories at a glance:**\n` +
    Object.entries(HELP_CATEGORIES).map(([, c]) =>
      `> ${c.emoji}  **${c.label}** — *${c.desc}*`
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

  // Category select menu — inside the container
  container.addActionRowComponents(makeCategorySelect('Browse Commands'));

  // Quick-action buttons — inside the container
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_quickstart')
        .setLabel('Quick Start')
        .setEmoji('🚀')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_edit')
        .setLabel('My Profile')
        .setEmoji('💫')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('daily_claim')
        .setLabel('Daily Claim')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Secondary),
    )
  );

  return container;
}

// ── Category page container ────────────────────────────────────────────────────

export function buildHelpCategoryPage(catArg, page, cmds) {
  const cat        = HELP_CATEGORIES[catArg] ?? { emoji: '✦', label: catArg, desc: '' };
  const totalPages = Math.max(1, Math.ceil(cmds.length / HELP_PAGE_SIZE));
  const safePage   = Math.max(0, Math.min(page, totalPages - 1));
  const slice      = cmds.slice(safePage * HELP_PAGE_SIZE, (safePage + 1) * HELP_PAGE_SIZE);

  const cmdLines = slice.map(c => {
    const aliases = c.aliases?.length
      ? `  ·  ${c.aliases.map(a => `\`luv ${a}\``).join('  ·  ')}`
      : '';
    const desc = c.description ? `  —  *${c.description}*` : '';
    return `> ⤿  \`luv ${c.name}\`${aliases}${desc}`;
  }).join('\n');

  const pageIndicator = totalPages > 1
    ? `\`Page ${safePage + 1} / ${totalPages}\`\n\n`
    : '';

  const content =
    `**﹕ⵌ┆ ${cat.emoji} ${cat.label} Commands ꩜ .**\n\n` +
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

  // Browse-another select — inside the container
  container.addActionRowComponents(
    makeCategorySelect(`Browsing: ${cat.label}  ·  Pick another...`)
  );

  // Pagination + back buttons — inside the container
  const navButtons = [
    new ButtonBuilder()
      .setCustomId('help_home')
      .setLabel('Home')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary),
  ];

  if (totalPages > 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`help_page:${catArg}:${safePage - 1}`)
        .setLabel('Prev')
        .setEmoji('⬅️')
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
        .setEmoji('➡️')
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
    `**﹕ⵌ┆ 🚀 Quick Start ꩜ .**\n\n` +
    `**Here's everything you need to get going right away.ᐟ**\n\n` +
    `**<:right:1501255316350959858> Essential Commands:**\n` +
    `> ⤿  \`luv profile\` — view your profile card\n` +
    `> ⤿  \`luv daily\` — claim your daily XP & hearts\n` +
    `> ⤿  \`luv match\` — get a daily match recommendation\n` +
    `> ⤿  \`luv rank\` — check your level and XP progress\n` +
    `> ⤿  \`luv confess\` — send an anonymous confession\n` +
    `> ⤿  \`luv crush @user\` — secretly set your crush\n` +
    `> ⤿  \`luv chemistry @user\` — check your bond score\n` +
    `> ⤿  \`luv midnight\` — enter late-night mode 🌙\n\n` +
    `**<:right:1501255316350959858> Earning Hearts 💗:**\n` +
    `> ⤿  Claim daily rewards  ·  build streaks  ·  unlock achievements\n\n` +
    `**<:right:1501255316350959858> Tips:**\n` +
    `> ⤿  All commands work as \`luv <cmd>\` **or** \`u <cmd>\`\n` +
    `> ⤿  Slash commands \`/<cmd>\` work too!\n` +
    `> ⤿  Hidden commands exist — explore to find them 🔥`;

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
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('daily_claim')
        .setLabel('Claim Daily')
        .setEmoji('🎁')
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

    // Direct category lookup
    if (catArg && HELP_CATEGORIES[catArg]) {
      const cmds = [...client.commands.values()].filter(c => c.category === catArg);
      const { container } = buildHelpCategoryPage(catArg, 0, cmds);
      return await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [container],
      });
    }

    // Main help menu
    const container = buildHelpMainContainer(client);
    await message.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [container],
    });
  },
};
