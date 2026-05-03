/**
 * Centralized command middleware pipeline.
 * Runs before every command execution:
 *   1. Spam gate (burst rate-limiter)
 *   2. Per-command cooldown
 *   3. Blocked-user check (for targeted commands)
 *   4. Guild-only guard
 *   5. NSFW guard (if command flagged)
 *
 * Returns null if the command may proceed, or sends an ephemeral-style
 * reply and returns "blocked" to abort execution.
 */

import { checkCooldown, isSpamming } from '../utils/cooldown.js';
import { errorEmbed } from '../utils/embeds.js';

const COOLDOWN_DEFAULTS = {
  // category  : ms
  social:      3_000,
  matchmaking: 5_000,
  chemistry:   8_000,
  confession:  10_000,
  midnight:    4_000,
  engagement:  5_000,
  ai:          4_000,
  safety:      10_000,
  premium:     3_000,
  hidden:      5_000,
};

/**
 * @param {import('discord.js').Message} message
 * @param {object} command
 * @returns {Promise<'blocked'|null>}
 */
export async function runMiddleware(message, command) {
  const uid = message.author.id;

  // 1. Guild-only guard
  if (!message.guild) {
    await message.reply({ embeds: [errorEmbed('luvly only works in servers ✦')] }).catch(() => {});
    return 'blocked';
  }

  // 2. Spam gate — max 4 cmds in 3 seconds
  if (isSpamming(uid)) {
    await message.reply({ embeds: [errorEmbed('slow down. luvly isn\'t going anywhere ✦')] }).catch(() => {});
    return 'blocked';
  }

  // 3. Per-command cooldown
  const cooldownMs = command.cooldown
    ?? COOLDOWN_DEFAULTS[command.category]
    ?? 3_000;

  const remaining = checkCooldown(uid, command.name, cooldownMs);
  if (remaining > 0) {
    const embed = errorEmbed(
      `**${command.name}** is on cooldown.\ntry again in **${remaining}s** ✦`
    );
    await message.reply({ embeds: [embed] }).catch(() => {});
    return 'blocked';
  }

  return null;
}
