import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  client.commands = new Map();
  client.aliases  = new Map();

  const commandsDir = join(__dirname, '../commands');
  const categories  = readdirSync(commandsDir).filter(f =>
    statSync(join(commandsDir, f)).isDirectory()
  );

  for (const category of categories) {
    const categoryDir = join(commandsDir, category);
    const files = readdirSync(categoryDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const mod = await import(`../commands/${category}/${file}`);
      const cmd = mod.default;
      if (!cmd?.name) continue;
      client.commands.set(cmd.name, { ...cmd, category });
      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          client.aliases.set(alias, cmd.name);
        }
      }
    }
  }

  const slashCount = [...client.commands.values()].filter(c => c.data).length;
  console.log(
    `✦ loaded ${client.commands.size} commands across ${categories.length} categories` +
    ` (${slashCount} with slash support)`
  );
}
