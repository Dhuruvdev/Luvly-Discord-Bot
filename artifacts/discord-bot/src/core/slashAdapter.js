/**
 * core/slashAdapter.js — Converts a Discord slash (ChatInputCommand) interaction
 * into a fake "message" object that prefix-style execute() functions can consume
 * without modification.
 *
 * Handles:
 *   - message.author          → interaction.user
 *   - message.guild           → interaction.guild
 *   - message.channel         → proxied channel object
 *   - message.mentions.users.first() → resolved user option
 *   - message.reply(data)     → interaction.reply() or editReply() after defer
 *   - message.channel.sendTyping()   → interaction.deferReply() (shows "thinking…")
 *   - loadingMsg.edit(data)   → interaction.editReply()
 */

export function createSlashAdapter(interaction) {
  let deferred = false;
  let replied  = false;

  // ── Defer helper (idempotent) ──────────────────────────────────────────────
  const defer = async (ephemeral = false) => {
    if (!deferred && !replied) {
      deferred = true;
      await interaction.deferReply({ ephemeral }).catch(() => {});
    }
  };

  // ── Edit proxy returned from reply() calls ─────────────────────────────────
  const makeEditProxy = () => ({
    edit:   async (data)  => interaction.editReply(data).catch(() => {}),
    delete: async ()      => {},
  });

  // ── Unified reply function ─────────────────────────────────────────────────
  const reply = async (data) => {
    if (deferred) {
      await interaction.editReply(data).catch(() => {});
      replied = true;
      return makeEditProxy();
    }
    if (replied) {
      await interaction.followUp(data).catch(() => {});
      return makeEditProxy();
    }
    replied = true;
    await interaction.reply({ ...data, fetchReply: true }).catch(() => {});
    return makeEditProxy();
  };

  // ── Channel proxy ──────────────────────────────────────────────────────────
  const channel = {
    id:         interaction.channelId,
    name:       interaction.channel?.name ?? '',
    guild:      interaction.guild,
    type:       interaction.channel?.type,
    send:       async (data) => {
      if (!replied && !deferred) return reply(data);
      return interaction.followUp(data).catch(() => {});
    },
    sendTyping: async () => defer(),
  };

  // ── Mentions proxy ─────────────────────────────────────────────────────────
  const mentions = {
    users: {
      first: () => {
        for (const name of ['user', 'target', 'member']) {
          try {
            const u = interaction.options.getUser(name);
            if (u) return u;
          } catch {}
        }
        return null;
      },
    },
  };

  return {
    // Core identity
    author:  interaction.user,
    member:  interaction.member,
    guild:   interaction.guild,
    channel,
    mentions,

    // Content (used by some commands for sub-command detection)
    content:     `/${interaction.commandName}`,

    // Reply interface
    reply,

    // Metadata
    _isSlash:     true,
    _interaction: interaction,
  };
}

/**
 * Build a prefix-style args array from a slash interaction's options.
 * Handles subcommands, string options (category, id, action, reason),
 * and returns a clean array the existing execute() can parse.
 */
export function buildSlashArgs(interaction) {
  const opts = interaction.options;
  const args = [];

  // Subcommand first
  try {
    const sub = opts.getSubcommand();
    if (sub) args.push(sub);
  } catch {}

  // Common string option names, in priority order
  for (const name of ['category', 'id', 'action', 'reason']) {
    try {
      const val = opts.getString(name);
      if (val != null) args.push(val);
    } catch {}
  }

  return args;
}

// ── Category cooldown defaults (mirror from middleware) ────────────────────────
export const COOLDOWN_DEFAULTS = {
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
