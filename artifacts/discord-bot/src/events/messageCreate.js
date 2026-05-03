import { PREFIXES } from '../config.js';
import { errorEmbed } from '../utils/embeds.js';
import { updateLastSeen } from '../utils/database.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    updateLastSeen(message.author.id);

    let usedPrefix = null;
    let content = message.content;

    for (const prefix of PREFIXES) {
      if (content.startsWith(prefix)) {
        usedPrefix = prefix;
        content = content.slice(prefix.length).trim();
        break;
      }
    }

    if (!usedPrefix) return;

    const args = content.split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const name = client.aliases.get(commandName) || commandName;
    const command = client.commands.get(name);

    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[CMD ERROR] ${command.name}:`, err);
      const embed = errorEmbed('something broke. try again in a sec 💔');
      await message.reply({ embeds: [embed] }).catch(() => {});
    }
  },
};
