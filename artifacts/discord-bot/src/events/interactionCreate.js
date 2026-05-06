import { MessageFlags } from 'discord.js';
import { luvContainer } from '../utils/embeds.js';
import { buildHandlers } from '../handlers/componentHandler.js';
import { isButtonDebounced } from '../utils/cooldown.js';

let _handlers = null;
function getHandlers(client) {
  if (!_handlers) {
    try {
      _handlers = buildHandlers(client);
    } catch (err) {
      console.error('[HANDLER BUILD ERROR]', err);
      return null;
    }
  }
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
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
      const method = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
      await interaction[method]({
        flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        components: [luvContainer('>  something went wrong ')],
      }).catch(() => {});
    }
  },
};

async function handleButton(interaction, handlers, client) {
  const uid = interaction.user.id;

  if (isButtonDebounced(uid, interaction.customId)) {
    return interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [luvContainer('>  slow down ✦')],
    }).catch(() => {});
  }

  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.buttons[action];

  if (handler) {
    await handler(interaction, parts, client);
  } else {
    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [luvContainer('>  this button has expired ✦')],
    }).catch(() => {});
  }
}

async function handleSelect(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.selects[action];
  if (handler) {
    await handler(interaction, parts, client);
  } else {
    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [luvContainer('>  this menu is no longer active ✦')],
    }).catch(() => {});
  }
}

async function handleModal(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.modals[action];
  if (handler) {
    await handler(interaction, parts, client);
  } else {
    await interaction.reply({
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
      components: [luvContainer('>  this form is no longer active ✦')],
    }).catch(() => {});
  }
}
