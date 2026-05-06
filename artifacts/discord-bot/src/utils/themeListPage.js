/**
 * Shared builder for the paginated theme list.
 * Returns { embed, files, components } ready to pass to message.reply / i.editReply.
 */

import { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../config.js';
import { luvEmbed, footer } from './embeds.js';
import { getUser, getHearts, getUserTheme, getOwnedThemes } from './database.js';
import { generateCard } from './cardGenerator.js';
import { THEME_LIST, RARITY_COLORS } from '../themes/index.js';

const TOTAL = THEME_LIST.length;

/**
 * Build one page of the theme gallery.
 *
 * @param {string}  userId   - Discord user ID (whose card + ownership we use)
 * @param {number}  pageIdx  - 0-based index into THEME_LIST
 * @param {object}  client   - Discord client (for footer)
 * @param {object}  discordUser - Discord User object (for avatar)
 * @returns {{ embed, files, components }}
 */
export async function buildThemeListPage(userId, pageIdx, client, discordUser) {
  const idx   = Math.max(0, Math.min(pageIdx, TOTAL - 1));
  const theme = THEME_LIST[idx];

  const dbUser  = getUser(userId);
  const hearts  = getHearts(userId);
  const owned   = getOwnedThemes(userId);
  const current = getUserTheme(userId);
  const isOwned = owned.includes(theme.id);
  const active  = current === theme.id;

  // ── Generate card image ───────────────────────────────────────────────────
  const avatarURL = discordUser?.displayAvatarURL({ extension: 'png', size: 256 }) ?? null;
  const buffer = await generateCard({
    username:  discordUser?.username ?? 'you',
    avatarURL,
    pronouns:  dbUser.pronouns,
    bio:       dbUser.bio,
    interests: dbUser.interests ?? [],
    xp:        dbUser.xp    ?? 0,
    streak:    dbUser.streak ?? 0,
    hearts,
    aura:      dbUser.aura  ?? 'soft',
  }, theme.id);

  const fileName   = `theme-${theme.id}.png`;
  const attachment = new AttachmentBuilder(buffer, { name: fileName });

  // ── Rarity info ───────────────────────────────────────────────────────────
  const rarityInfo = RARITY_COLORS[theme.rarity] ?? RARITY_COLORS.common;
  const rarityStr  = { common: '⬜ Common', rare: '🟦 Rare', legendary: '🟨 Legendary' }[theme.rarity] ?? theme.rarity;
  const costStr    = theme.cost === 0 ? '🆓 Free' : `💗 ${theme.cost} hearts`;
  const statusStr  = active ? '📌 Equipped' : (isOwned ? '✅ Owned' : '🔒 Not Owned');

  // ── Embed ─────────────────────────────────────────────────────────────────
  const embed = luvEmbed(0x26272F)
    .setTitle(`${theme.emoji} ${theme.name}`)
    .setDescription(`*${theme.description}*`)
    .addFields(
      { name: 'Rarity',  value: rarityStr,  inline: true },
      { name: 'Cost',    value: costStr,     inline: true },
      { name: 'Status',  value: statusStr,   inline: true },
    )
    .setImage(`attachment://${fileName}`)
    .setFooter({ text: `page ${idx + 1} / ${TOTAL} · use ◀ ▶ to browse · ${footer(client).text}` });

  // ── Navigation row ────────────────────────────────────────────────────────
  const prevId = `tlg:${idx - 1}:${userId}`;
  const nextId = `tlg:${idx + 1}:${userId}`;

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(prevId)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx === 0),

    new ButtonBuilder()
      .setCustomId(`tlg:${idx}:${userId}_noop`)
      .setLabel(`${idx + 1} / ${TOTAL}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(nextId)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx === TOTAL - 1),
  );

  // ── Action row (buy / equip / active) ─────────────────────────────────────
  const actionRow = new ActionRowBuilder();

  if (active) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`tls:${theme.id}:${userId}_active`)
        .setLabel('📌 currently equipped')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
    );
  } else if (isOwned) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`tls:${theme.id}:${userId}`)
        .setLabel(`equip ${theme.name}`)
        .setEmoji(theme.emoji)
        .setStyle(ButtonStyle.Primary),
    );
  } else if (theme.cost === 0) {
    // Free theme not yet added to owned list (edge case) — just equip it
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`tls:${theme.id}:${userId}`)
        .setLabel('equip (free!)')
        .setEmoji(theme.emoji)
        .setStyle(ButtonStyle.Success),
    );
  } else {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`tlb:${theme.id}:${userId}`)
        .setLabel(`buy · ${theme.cost} 💗`)
        .setEmoji(theme.emoji)
        .setStyle(hearts >= theme.cost ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(hearts < theme.cost),
    );
  }

  return {
    embed,
    files:      [attachment],
    components: [navRow, actionRow],
  };
}
