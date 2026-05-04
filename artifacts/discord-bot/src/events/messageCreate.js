import { PREFIXES } from '../config.js';
import { errorEmbed } from '../utils/embeds.js';
import { updateLastSeen } from '../utils/database.js';
import { runMiddleware } from '../middleware/commandMiddleware.js';

// Only update lastSeen at most once per 60 seconds per user (no disk I/O spam)
const seenThrottle = new Map();

export default {
  name: 'messageCreate',
  async execute(message, client) {
    if (message.author.bot || !message.guild) return;

    // throttled lastSeen — fires at most every 60s per user
    const now = Date.now();
    const lastSeen = seenThrottle.get(message.author.id) ?? 0;
    if (now - lastSeen > 60_000) {
      seenThrottle.set(message.author.id, now);
      updateLastSeen(message.author.id);
    }

    let content = message.content;
    let matched  = false;

    // ── Standard prefix detection ─────────────────────────────────────────────
    for (const prefix of PREFIXES) {
      if (content.startsWith(prefix)) {
        content = content.slice(prefix.length).trim();
        matched  = true;
        break;
      }
    }

    // ── @mention prefix — e.g. @Luvly card, @Luvly card @user ───────────────
    if (!matched && client.user) {
      const botId         = client.user.id;
      const mentionForms  = [`<@${botId}>`, `<@!${botId}>`];
      for (const mp of mentionForms) {
        if (content.startsWith(mp)) {
          const rest = content.slice(mp.length).trim();
          if (rest.length > 0) {
            content = rest;
            matched = true;
          }
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

    // middleware (cooldown, spam, etc.)
    const blocked = await runMiddleware(message, command);
    if (blocked) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(`[CMD ERROR] ${command.name}:`, err);
      const embed = errorEmbed('something broke on our end. try again in a sec 💔');
      await message.reply({ embeds: [embed] }).catch(() => {});
    }
  },
};
