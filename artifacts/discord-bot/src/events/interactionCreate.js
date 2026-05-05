/**
 * interactionCreate.js — Central interaction router.
 *
 * Routes:
 *   1. ChatInputCommand (slash commands)  → handleSlash()
 *   2. ButtonInteraction                  → handleButton()
 *   3. StringSelectMenuInteraction        → handleSelect()
 *   4. ModalSubmitInteraction             → handleModal()
 *
 * Features:
 *   - Button debounce (1.5s per user/component) prevents double-click spam
 *   - Slash command cooldown mirror (matches prefix cooldowns)
 *   - Ephemeral error replies everywhere
 *   - Single error boundary — no crashes on unknown interactions
 */

import { errorEmbed } from '../utils/embeds.js';
import { buildHandlers } from '../handlers/componentHandler.js';
import { createSlashAdapter, buildSlashArgs, COOLDOWN_DEFAULTS } from '../core/slashAdapter.js';
import { checkCooldown, isSpamming, isButtonDebounced } from '../utils/cooldown.js';

// Build component handlers once per process
let _handlers = null;
function getHandlers(client) {
  if (!_handlers) _handlers = buildHandlers(client);
  return _handlers;
}

// ── Interaction dispatch ───────────────────────────────────────────────────────
export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    const handlers = getHandlers(client);

    try {
      if      (interaction.isChatInputCommand())    await handleSlash(interaction, client);
      else if (interaction.isButton())              await handleButton(interaction, handlers, client);
      else if (interaction.isStringSelectMenu())    await handleSelect(interaction, handlers, client);
      else if (interaction.isModalSubmit())         await handleModal(interaction, handlers, client);
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
      const embed  = errorEmbed('something went wrong 💔');
      const method = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
      await interaction[method]({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  },
};

// ── Slash command handler ──────────────────────────────────────────────────────
async function handleSlash(interaction, client) {
  const name    = interaction.commandName;
  const command = client.commands.get(name);

  if (!command) {
    return interaction.reply({
      embeds: [errorEmbed('command not found — try `/help` ✦')],
      ephemeral: true,
    }).catch(() => {});
  }

  const uid = interaction.user.id;

  // Spam gate
  if (isSpamming(uid)) {
    return interaction.reply({
      embeds: [errorEmbed("slow down. luvly isn't going anywhere ✦")],
      ephemeral: true,
    }).catch(() => {});
  }

  // Per-command cooldown
  const cooldownMs = command.cooldown ?? COOLDOWN_DEFAULTS[command.category] ?? 3_000;
  const remaining  = checkCooldown(uid, command.name, cooldownMs);
  if (remaining > 0) {
    return interaction.reply({
      embeds: [errorEmbed(`**${command.name}** is on cooldown.\ntry again in **${remaining}s** ✦`)],
      ephemeral: true,
    }).catch(() => {});
  }

  // Execute via adapter (converts slash interaction to fake message)
  const fakeMessage = createSlashAdapter(interaction);
  const args        = buildSlashArgs(interaction);

  try {
    await command.execute(fakeMessage, args, client);
  } catch (err) {
    console.error(`[SLASH ERROR] /${name}:`, err);
    const embed  = errorEmbed('something broke on our end 💔');
    const method = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
    await interaction[method]({ embeds: [embed], ephemeral: true }).catch(() => {});
  }
}

// ── Button handler (with debounce) ────────────────────────────────────────────
async function handleButton(interaction, handlers, client) {
  const uid = interaction.user.id;

  // Debounce — prevents double-click spam (1.5s window per user per button)
  if (isButtonDebounced(uid, interaction.customId)) {
    return interaction.reply({
      embeds: [errorEmbed('slow down ✦')],
      ephemeral: true,
    }).catch(() => {});
  }

  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.buttons[action];

  if (handler) {
    await handler(interaction, parts, client);
  } else {
    await interaction.reply({
      embeds: [errorEmbed('this button has expired ✦')],
      ephemeral: true,
    }).catch(() => {});
  }
}

// ── Select menu handler ────────────────────────────────────────────────────────
async function handleSelect(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.selects[action];
  if (handler) await handler(interaction, parts, client);
}

// ── Modal handler ──────────────────────────────────────────────────────────────
async function handleModal(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.modals[action];
  if (handler) await handler(interaction, parts, client);
}
