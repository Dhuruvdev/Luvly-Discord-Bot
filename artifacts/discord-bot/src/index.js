import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents }   from './handlers/eventHandler.js';
import { forceFlush }   from './utils/store.js';

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('✦ ERROR: DISCORD_TOKEN is not set. Add it to your Replit secrets.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
  // Reduce memory: don't cache messages we don't need
  sweepers: {
    messages: { interval: 300, lifetime: 300 },
  },
});

await loadCommands(client);
await loadEvents(client);
await client.login(token);
