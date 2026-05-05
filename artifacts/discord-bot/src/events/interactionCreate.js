/**
 * interactionCreate.js — Central interaction router.
 *
 * Routes:
 *   1. ButtonInteraction       → handleButton()
 *   2. StringSelectMenuInteraction → handleSelect()
 *   3. ModalSubmitInteraction  → handleModal()
 *
 * Features:
 *   - Button debounce (1.5s per user/component) prevents double-click spam
 *   - Single error boundary — no crashes on unknown interactions
 *
 * Note: slash commands are intentionally not handled — this bot uses prefix
 * commands only (u profile, luv match, etc.).
 */

import { errorEmbed } from '../utils/embeds.js';
import { buildHandlers } from '../handlers/componentHandler.js';
import { isButtonDebounced } from '../utils/cooldown.js';

let _handlers = null;
function getHandlers(client) {
  if (!_handlers) _handlers = buildHandlers(client);
  return _handlers;
}

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    const handlers = getHandlers(client);

    try {
      if      (interaction.isButton())           await handleButton(interaction, handlers, client);
      else if (interaction.isStringSelectMenu()) await handleSelect(interaction, handlers, client);
      else if (interaction.isModalSubmit())      await handleModal(interaction, handlers, client);
      // ChatInputCommand (slash) not handled — prefix-only bot
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
      const embed  = errorEmbed('something went wrong 💔');
      const method = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
      await interaction[method]({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  },
};

// ── Button handler (with debounce) ────────────────────────────────────────────
async function handleButton(interaction, handlers, client) {
  const uid = interaction.user.id;

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
