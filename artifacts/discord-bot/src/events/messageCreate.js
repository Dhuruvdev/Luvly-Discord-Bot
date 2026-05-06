import { MessageFlags } from 'discord.js';
import { PREFIXES } from '../config.js';
import { luvContainer } from '../utils/embeds.js';
import { updateLastSeen } from '../utils/database.js';
import { runMiddleware } from '../middleware/commandMiddleware.js';

const seenThrottle = new Map();

// Build a flat map of noPrefix owner commands: commandName/alias → command
function buildOwnerMap(client) {
  const map = new Map();
  for (const [, cmd] of client.commands) {
    if (!cmd.ownerOnly || !cmd.noPrefix) continue;
    map.set(cmd.name.toLowerCase(), cmd);
    for (const alias of cmd.aliases ?? []) map.set(alias.toLowerCase(), cmd);
  }
  return map;
}

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

    const ownerId = process.env.OWNER_ID;
    const isOwner = ownerId && message.author.id === ownerId;

    // ── No-prefix owner commands (checked BEFORE prefix stripping) ──────────────
    if (isOwner) {
      const raw   = message.content.trim();
      const parts = raw.split(/\s+/);
      const first = parts[0]?.toLowerCase();
      if (first) {
        const ownerMap = buildOwnerMap(client);
        const ownerCmd = ownerMap.get(first);
        if (ownerCmd) {
          const args = parts.slice(1);
          try {
            await ownerCmd.execute(message, args, client);
          } catch (err) {
            console.error(`[OWNER CMD ERROR] ${ownerCmd.name}:`, err);
            await message.reply({
              flags: MessageFlags.IsComponentsV2,
              components: [luvContainer('> something went wrong running that owner command ✦')],
            }).catch(() => {});
          }
          return;
        }
      }
    }

    // ── Normal prefix / mention routing ────────────────────────────────────────
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
        components: [luvContainer('>  something broke on our end. try again in a sec ')],
      }).catch(() => {});
    }
  },
};
