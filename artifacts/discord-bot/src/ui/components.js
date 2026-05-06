/**
 * ui/components.js — Reusable Discord component builders for Luvly.
 *
 * All components follow Discord's 5-per-row / 5-rows-per-message limits.
 * Custom IDs use namespaced pattern: action[:param1[:param2]]
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';

// ── Generic builders ───────────────────────────────────────────────────────────

/**
 * Build a single ActionRow with up to 5 buttons.
 * @param {...{id, label, emoji?, style?, disabled?, url?}} defs
 */
export function buildButtons(...defs) {
  const row = new ActionRowBuilder();
  for (const d of defs.slice(0, 5)) {
    if (d.url) {
      const btn = new ButtonBuilder()
        .setLabel(d.label)
        .setStyle(ButtonStyle.Link)
        .setURL(d.url);
      if (d.emoji) btn.setEmoji(d.emoji);
      row.addComponents(btn);
    } else {
      const btn = new ButtonBuilder()
        .setCustomId(d.id)
        .setLabel(d.label)
        .setStyle(d.style ?? ButtonStyle.Secondary);
      if (d.emoji)    btn.setEmoji(d.emoji);
      if (d.disabled) btn.setDisabled(true);
      row.addComponents(btn);
    }
  }
  return row;
}

/**
 * Single primary action button.
 */
export function primaryButton(id, label, emoji) {
  const btn = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Primary);
  if (emoji) btn.setEmoji(emoji);
  return new ActionRowBuilder().addComponents(btn);
}

/**
 * Single danger button.
 */
export function dangerButton(id, label, emoji) {
  const btn = new ButtonBuilder().setCustomId(id).setLabel(label).setStyle(ButtonStyle.Danger);
  if (emoji) btn.setEmoji(emoji);
  return new ActionRowBuilder().addComponents(btn);
}

// ── Pagination ─────────────────────────────────────────────────────────────────

/**
 * Standard  · N/T ·  pagination row.
 * prefix = custom ID prefix, e.g. 'tlg'
 */
export function paginationRow(idx, total, userId, prefix) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}:${idx - 1}:${userId}`)
      .setLabel('')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx === 0),

    new ButtonBuilder()
      .setCustomId(`${prefix}_page:${idx}:${userId}`)
      .setLabel(`${idx + 1} / ${total}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`${prefix}:${idx + 1}:${userId}`)
      .setLabel('')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(idx >= total - 1),
  );
}

// ── Profile actions ────────────────────────────────────────────────────────────

export function profileActions() {
  return buildButtons(
    { id: 'profile_edit', label: 'edit profile', emoji: '',  style: ButtonStyle.Primary },
    { id: 'profile_aura', label: 'change aura',  emoji: '',  style: ButtonStyle.Secondary },
    { id: 'daily_claim',  label: 'claim daily',  emoji: '',  style: ButtonStyle.Success },
  );
}

export function cardActions() {
  return buildButtons(
    { id: 'profile_edit', label: 'edit profile', emoji: '',  style: ButtonStyle.Primary },
    { id: 'profile_aura', label: 'change aura',  emoji: '',  style: ButtonStyle.Secondary },
    { id: 'daily_claim',  label: 'claim daily',  emoji: '',  style: ButtonStyle.Success },
  );
}

// ── Match actions ──────────────────────────────────────────────────────────────

export function matchActions() {
  return buildButtons(
    { id: 'match_again', label: 'try another', emoji: '', style: ButtonStyle.Secondary },
    { id: 'match_crush', label: 'set as crush', emoji: '', style: ButtonStyle.Primary },
  );
}

// ── Crush actions ──────────────────────────────────────────────────────────────

export function crushRevealActions(targetId, isMutual) {
  return buildButtons(
    {
      id:    `crush_reveal:${targetId}`,
      label: isMutual ? 'reveal!' : 'check mutual',
      emoji: isMutual ? '' : '',
      style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary,
    },
    { id: 'crush_anonymous', label: 'keep secret', emoji: '', style: ButtonStyle.Secondary },
  );
}

// ── Comfort actions ────────────────────────────────────────────────────────────

export function comfortActions() {
  return buildButtons(
    { id: 'comfort_more', label: 'i need more',   emoji: '', style: ButtonStyle.Secondary },
    { id: 'comfort_done', label: 'i feel better', emoji: '', style: ButtonStyle.Success },
  );
}

// ── Midnight actions ───────────────────────────────────────────────────────────

export function midnightActions() {
  return buildButtons(
    { id: 'midnight_confess', label: 'say something', emoji: '', style: ButtonStyle.Primary },
    { id: 'midnight_comfort', label: 'comfort me',    emoji: '', style: ButtonStyle.Secondary },
    { id: 'midnight_vibe',    label: 'vibe check',    emoji: '', style: ButtonStyle.Secondary },
  );
}

// ── Rizz actions ───────────────────────────────────────────────────────────────

export function rizzActions() {
  return buildButtons(
    { id: 'rizz_new',  label: 'new line', emoji: '', style: ButtonStyle.Secondary },
    { id: 'rizz_copy', label: 'use this', emoji: '', style: ButtonStyle.Primary },
  );
}

// ── Chemistry actions ──────────────────────────────────────────────────────────

export function chemActions(targetId) {
  return buildButtons(
    { id: `chem_boost:${targetId}`, label: 'boost chemistry', emoji: '', style: ButtonStyle.Primary },
  );
}

// ── Confession actions ─────────────────────────────────────────────────────────

export function confessOpenAction() {
  return buildButtons(
    { id: 'confess_open', label: 'write confession', emoji: '', style: ButtonStyle.Primary },
  );
}

export function confessRevealAction(confessionId) {
  return buildButtons(
    { id: `confess_reveal:${confessionId}`, label: 'reveal yourself', emoji: '', style: ButtonStyle.Danger },
  );
}

// ── Rank actions ───────────────────────────────────────────────────────────────

export function rankActions() {
  return buildButtons(
    { id: 'daily_claim', label: 'claim daily', emoji: '', style: ButtonStyle.Primary },
    { id: 'shop_open',   label: 'open shop',   emoji: '', style: ButtonStyle.Secondary },
  );
}

// ── Help select menu ───────────────────────────────────────────────────────────

export function helpCategorySelect(categories) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('explore a category...')
    .addOptions(
      Object.entries(categories).map(([key, c]) => ({
        label:       c.label,
        description: c.desc,
        value:       key,
        ...(c.emoji ? { emoji: c.emoji } : {}),
      }))
    );
  return new ActionRowBuilder().addComponents(select);
}

// ── Shop preview select menu ───────────────────────────────────────────────────

export function shopPreviewSelect(items) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('shop_preview')
    .setPlaceholder('preview an item...')
    .addOptions(
      Object.values(items).map(i => ({
        label:       i.name,
        description: `${i.price}  — ${i.desc.replace(/\*\*/g, '').slice(0, 50)}`,
        value:       i.id,
        ...(i.emoji ? { emoji: i.emoji } : {}),
      }))
    );
  return new ActionRowBuilder().addComponents(select);
}

// ── Confess gate button ────────────────────────────────────────────────────────

export function missActions() {
  return buildButtons(
    { id: 'midnight_confess', label: 'say something', emoji: '', style: ButtonStyle.Primary },
    { id: 'comfort_more',     label: 'comfort me',    emoji: '', style: ButtonStyle.Secondary },
  );
}

export function overthinkActions() {
  return buildButtons(
    { id: 'midnight_confess', label: 'say something', emoji: '', style: ButtonStyle.Primary },
    { id: 'midnight_vibe',    label: 'vibe check',    emoji: '', style: ButtonStyle.Secondary },
  );
}

export function playlistActions() {
  return buildButtons(
    { id: 'rizz_new',         label: 'different vibe', emoji: '', style: ButtonStyle.Secondary },
    { id: 'midnight_comfort', label: 'comfort mode',   emoji: '', style: ButtonStyle.Secondary },
  );
}
