import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../config.js';

export function luvEmbed(color = COLORS.primary) {
  return new EmbedBuilder().setColor(color);
}

export function errorEmbed(msg) {
  return luvEmbed(COLORS.error)
    .setDescription(`${EMOJIS.safety} ${msg}`);
}

export function successEmbed(msg) {
  return luvEmbed(COLORS.success)
    .setDescription(`${EMOJIS.sparkle} ${msg}`);
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
