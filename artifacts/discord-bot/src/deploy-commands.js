/**
 * deploy-commands.js — Register all slash commands with Discord.
 *
 * Run once (or whenever commands change) with:
 *   pnpm --filter @workspace/discord-bot run deploy
 *
 * Required env vars: DISCORD_TOKEN, CLIENT_ID
 * Optional env var:  GUILD_ID — deploys to one guild instantly (dev mode)
 *
 * Without GUILD_ID → global deploy (up to 1 hour to propagate)
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const TOKEN     = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID  = process.env.GUILD_ID;

if (!TOKEN)     { console.error('✦ ERROR: DISCORD_TOKEN not set'); process.exit(1); }
if (!CLIENT_ID) { console.error('✦ ERROR: CLIENT_ID not set (find it in your Discord Developer Portal)'); process.exit(1); }

const commands = [];
const commandsDir = join(__dirname, 'commands');
const categories  = readdirSync(commandsDir).filter(f => statSync(join(commandsDir, f)).isDirectory());

for (const cat of categories) {
  const files = readdirSync(join(commandsDir, cat)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const mod = await import(`./commands/${cat}/${file}`);
    const cmd = mod.default;
    if (cmd?.data) {
      commands.push(cmd.data.toJSON());
      console.log(`  ✓ ${cmd.data.name}`);
    }
  }
}

console.log(`\n✦ deploying ${commands.length} slash commands...`);

const rest = new REST().setToken(TOKEN);

try {
  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✦ deployed to guild ${GUILD_ID} (instant — visible right away)`);
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✦ deployed globally (may take up to 1 hour to appear in all servers)');
  }
} catch (err) {
  console.error('✦ deploy failed:', err.message);
  process.exit(1);
}
