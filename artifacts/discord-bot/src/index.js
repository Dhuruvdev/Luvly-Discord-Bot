import 'dotenv/config';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { loadCommands } from './handlers/commandHandler.js';
import { loadEvents }   from './handlers/eventHandler.js';
import { forceFlush }   from './utils/store.js';
import { startKeepAliveServer } from './utils/keepAlive.js';

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
  sweepers: {
    messages: { interval: 300, lifetime: 300 },
  },
});

// Start keep-alive HTTP server immediately (before Discord login)
// so uptime monitors can reach it even during reconnects
startKeepAliveServer(client, parseInt(process.env.BOT_PORT ?? '3000', 10));

await loadCommands(client);
await loadEvents(client);
await client.login(token);
