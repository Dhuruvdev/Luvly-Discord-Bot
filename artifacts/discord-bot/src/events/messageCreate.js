import { MessageFlags } from 'discord.js';
import { PREFIXES } from '../config.js';
import { luvContainer } from '../utils/embeds.js';
import { updateLastSeen } from '../utils/database.js';
import { runMiddleware } from '../middleware/commandMiddleware.js';

const seenThrottle = new Map();

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    const now = Date.now();
    const lastSeen = seenThrottle.get(message.author.id) ?? 0;
    if (now - lastSeen > 60_000) {
      seenThrottle.set(message.author.id, now);
      updateLastSeen(message.author.id);
    }

    let content = message.content;
    let matched  = false;

    for (const prefix of PREFIXES) {
      if (content.startsWith(prefix)) {
        content = content.slice(prefix.length).trim();
        matched  = true;
        break;
      }
    }

    if (!matched && client.user) {
      const botId        = client.user.id;
      const mentionForms = [`<@${botId}>`, `<@!${botId}>`];
      for (const mp of mentionForms) {
        if (content.startsWith(mp)) {
          const rest = content.slice(mp.length).trim();

          if (rest.length === 0) {
            const container = luvContainer(
              '**﹕ⵌ┆ Hey there! I\'m Luvly ꩜ .**\n\n' +
              '**Your cute companion for fun, vibes & interactions.ᐟ **\n' +
              '━━━━━━━━━━━━━━━━━━\n' +
              '➜ **What I can do:**\n' +
              '        ⤿  __Fun games__\n' +
              '        ⤿  __Cute chats__\n' +
              '        ⤿  __Server features__\n\n' +
              '➜ **Type `luv help` to explore everything!**\n' +
              '━━━━━━━━━━━━━━━━━━\n' +
              '** 𝜗ৎ. Let\'s make your server more luvly.ᐟ**'
            );
            return await message.reply({ flags: MessageFlags.IsComponentsV2, components: [container] }).catch(() => {});
          }

          content = rest;
          matched = true;
          break;
        }
      }
    }

    if (!matched) return;

    const args        = content.split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const name    = client.aliases.get(commandName) ?? commandName;
    const command = client.commands.get(name);
    if (!command) return;

    const blocked = await runMiddleware(message, command);
    if (blocked) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[CMD ERROR] ${command.name}:`, err);
      await message.reply({
        flags: MessageFlags.IsComponentsV2,
        components: [luvContainer('> ⚠️ something broke on our end. try again in a sec 💔')],
      }).catch(() => {});
    }
  },
};
