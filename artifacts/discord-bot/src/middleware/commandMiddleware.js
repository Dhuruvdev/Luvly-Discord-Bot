/**
 * Centralized command middleware pipeline.
 * Runs before every command execution:
 *   1. Guild-only guard
 *   2. Spam gate (burst rate-limiter)
 *   3. Registration gate — user must complete luv setup first
 *      (exempt: help, setup, and their aliases)
 *   4. Per-command cooldown
 *
 * Returns null if the command may proceed, or sends an ephemeral-style
 * reply and returns "blocked" to abort execution.
 */

import { checkCooldown, isSpamming } from '../utils/cooldown.js';
import { errorEmbed, luvContainer } from '../utils/embeds.js';
import { getTable } from '../utils/store.js';
import { MessageFlags } from 'discord.js';

const CV2 = MessageFlags.IsComponentsV2;

const COOLDOWN_DEFAULTS = {
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

// Commands that don't require setup to be complete
const SETUP_EXEMPT = new Set([
  'help', 'h', 'commands', 'cmd',
  'setup', 'start', 'register', 'begin', 'create',
]);

function isRegistered(userId) {
  const users = getTable('users');
  return users[userId]?.setupComplete === true;
}

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

  // 3. Registration gate — must complete luv setup first
  const cmdName = command.name?.toLowerCase();
  const isExempt = SETUP_EXEMPT.has(cmdName) ||
    (command.aliases ?? []).some(a => SETUP_EXEMPT.has(a.toLowerCase()));

  if (!isExempt && !isRegistered(uid)) {
    await message.reply({
      flags: CV2,
      components: [luvContainer(
        `**﹕ⵌ┆ Welcome to Luvly ꩜ .**\n\n` +
        `you need to set up your profile before using this command.\n\n` +
        `<:right:1501255316350959858> type **\`luv setup\`** to get started ✦`
      )],
    }).catch(() => {});
    return 'blocked';
  }

  // 4. Per-command cooldown
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
