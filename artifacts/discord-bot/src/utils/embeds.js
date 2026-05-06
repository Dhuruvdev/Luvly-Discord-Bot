import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder, TextDisplayBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../config.js';

const ACCENT = 0x26272F;

export function luvEmbed(color = COLORS.primary) {
  return new EmbedBuilder().setColor(color);
}

export function luvContainer(content, ...actionRows) {
  const c = new ContainerBuilder()
    .setAccentColor(ACCENT)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(content));
  for (const row of actionRows) {
    if (row) c.addActionRowComponents(row);
  }
  return c;
}

export function errorEmbed(msg) {
  return luvContainer(`> ⚠️ ${msg}`);
}

export function successEmbed(msg) {
  return luvContainer(`${EMOJIS.sparkle} ${msg}`);
}

export function buildButtons(...defs) {
  const row = new ActionRowBuilder();
  for (const d of defs) {
    const btn = new ButtonBuilder()
      .setCustomId(d.id)
      .setLabel(d.label)
      .setStyle(d.style || ButtonStyle.Secondary);
    if (d.emoji) btn.setEmoji(d.emoji);
    if (d.disabled) btn.setDisabled(true);
    row.addComponents(btn);
  }
  return row;
}

export function buildLinkButton(label, url, emoji) {
  const btn = new ButtonBuilder()
    .setLabel(label)
    .setStyle(ButtonStyle.Link)
    .setURL(url);
  if (emoji) btn.setEmoji(emoji);
  return new ActionRowBuilder().addComponents(btn);
}

export function footer(client) {
  return { text: 'luvly ✦ made with ❤️', iconURL: client?.user?.displayAvatarURL() };
}
