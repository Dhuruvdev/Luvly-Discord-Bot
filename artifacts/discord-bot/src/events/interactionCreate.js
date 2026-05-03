import { errorEmbed } from '../utils/embeds.js';
import { buildHandlers } from '../handlers/componentHandler.js';

// Build once per process — handlers are stateless after construction
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
      if (interaction.isButton())          await handleButton(interaction, handlers, client);
      else if (interaction.isStringSelectMenu()) await handleSelect(interaction, handlers, client);
      else if (interaction.isModalSubmit()) await handleModal(interaction, handlers, client);
    } catch (err) {
      console.error('[INTERACTION ERROR]', err);
      const embed = errorEmbed('something went wrong 💔');
      const method = interaction.replied || interaction.deferred ? 'followUp' : 'reply';
      await interaction[method]({ embeds: [embed], ephemeral: true }).catch(() => {});
    }
  },
};

async function handleButton(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.buttons[action];
  if (handler) await handler(interaction, parts, client);
  else await interaction.reply({ embeds: [errorEmbed('this button has expired ✦')], ephemeral: true });
}

async function handleSelect(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.selects[action];
  if (handler) await handler(interaction, parts, client);
}

async function handleModal(interaction, handlers, client) {
  const [action, ...parts] = interaction.customId.split(':');
  const handler = handlers.modals[action];
  if (handler) await handler(interaction, parts, client);
}
