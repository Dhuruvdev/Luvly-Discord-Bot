import { errorEmbed } from '../utils/embeds.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isButton()) {
        await handleButton(interaction, client);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelect(interaction, client);
      } else if (interaction.isModalSubmit()) {
        await handleModal(interaction, client);
      }
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
      const embed = errorEmbed('something went wrong 💔');
      const method = interaction.replied || interaction.deferred
        ? 'followUp'
        : 'reply';
      await interaction[method]({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  },
};

async function handleButton(interaction, client) {
  const [action, ...parts] = interaction.customId.split(':');

  const handlers = await getComponentHandlers(client);
  const handler = handlers.buttons[action];
  if (handler) {
    await handler(interaction, parts, client);
  }
}

async function handleSelect(interaction, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handlers = await getComponentHandlers(client);
  const handler = handlers.selects[action];
  if (handler) {
    await handler(interaction, parts, client);
  }
}

async function handleModal(interaction, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handlers = await getComponentHandlers(client);
  const handler = handlers.modals[action];
  if (handler) {
    await handler(interaction, parts, client);
  }
}

let _handlers = null;
async function getComponentHandlers(client) {
  if (_handlers) return _handlers;
  const mod = await import('../handlers/componentHandler.js');
  _handlers = mod.buildHandlers(client);
  return _handlers;
}
