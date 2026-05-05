/**
 * ui/embeds.js — Premium embed builder system for Luvly.
 *
 * Design principles:
 *   - minimal text, strong hierarchy
 *   - soft emotional tone
 *   - spacing for readability
 *   - consistent color palette
 *   - no clutter, no walls of text
 */

import { EmbedBuilder } from 'discord.js';
import { COLORS, EMOJIS, getLevelData, getXpBar } from '../config.js';

// ── Separator characters ───────────────────────────────────────────────────────
export const SEP  = '·';
export const DASH = '—';
export const BULLET = '•';

// ── Base embed ─────────────────────────────────────────────────────────────────
export function luvEmbed(color = COLORS.primary) {
  return new EmbedBuilder().setColor(color);
}

// ── Footer builder ─────────────────────────────────────────────────────────────
export function luvFooter(client, extra = '') {
  const base = extra ? `luvly ✦  ${SEP}  ${extra}` : 'luvly ✦';
  return { text: base, iconURL: client?.user?.displayAvatarURL() };
}

// ── Error embed ────────────────────────────────────────────────────────────────
export function errorEmbed(msg) {
  return luvEmbed(COLORS.error)
    .setDescription(`${EMOJIS.safety} ${msg}`);
}

// ── Success embed ──────────────────────────────────────────────────────────────
export function successEmbed(msg, client) {
  const embed = luvEmbed(COLORS.success)
    .setDescription(`${EMOJIS.sparkle} ${msg}`);
  if (client) embed.setFooter(luvFooter(client));
  return embed;
}

// ── Profile card embed ─────────────────────────────────────────────────────────
export function profileEmbed({ user, discordUser, hearts, unlocked, isSelf, client }) {
  const { current, next } = getLevelData(user.xp ?? 0);
  const xpBar   = getXpBar(user.xp ?? 0, current, next);
  const auraColors = {
    soft:     COLORS.soft,
    ethereal: COLORS.purple,
    magnetic: COLORS.primary,
    chaotic:  COLORS.rose,
    midnight: COLORS.midnight,
    golden:   COLORS.gold,
  };

  const recentAch = unlocked.slice(-3).map(a => a.emoji).join('  ') || DASH;
  const badge     = user.badges?.length ? user.badges.join(' ') : null;

  const embed = luvEmbed(auraColors[user.aura] ?? COLORS.primary)
    .setAuthor({
      name:    `${discordUser.username} ✦`,
      iconURL: discordUser.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(discordUser.displayAvatarURL({ size: 256, dynamic: true }))
    .setDescription(user.bio
      ? `> *"${user.bio}"*`
      : `> *no bio yet — add one with* \`u profile edit\``)
    .addFields(
      { name: `${EMOJIS.star} aura`,        value: `**${user.aura ?? 'soft'}**`,                        inline: true },
      { name: `${EMOJIS.sparkle} pronouns`, value: user.pronouns ?? '*not set*',                        inline: true },
      { name: `${EMOJIS.rank} level`,       value: `**${current.level}** ${DASH} *${current.title}*`,   inline: true },
      { name: `${EMOJIS.fire} progress`,    value: `\`${xpBar}\``,                                      inline: false },
      { name: `${EMOJIS.heart} hearts`,     value: `**${hearts}** 💗`,                                   inline: true },
      { name: `${EMOJIS.streak} streak`,    value: `**${user.streak ?? 0}** days 🔥`,                    inline: true },
      { name: '👀 profile views',            value: `**${user.profileViews ?? 0}**`,                     inline: true },
    );

  if (user.interests?.length) {
    embed.addFields({
      name:  `${EMOJIS.heart} interests`,
      value: user.interests.map(i => `\`${i}\``).join('  '),
    });
  }

  embed.addFields({
    name:  '🏅 achievements',
    value: recentAch + (unlocked.length ? `  *(${unlocked.length} total)*` : ''),
  });

  if (badge) embed.addFields({ name: '🏷️ badges', value: badge });

  embed.setFooter(luvFooter(client, `${discordUser.username}'s profile`));

  return embed;
}

// ── Match card embed ───────────────────────────────────────────────────────────
export function matchEmbed({ author, matched, compat, vibe, sign, reason, client }) {
  const hearts   = Math.round(compat / 10);
  const heartBar = '❤️'.repeat(hearts) + '🤍'.repeat(10 - hearts);

  return luvEmbed(COLORS.primary)
    .setAuthor({
      name:    `${author.username}'s daily match ✦`,
      iconURL: author.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(matched.displayAvatarURL({ size: 256, dynamic: true }))
    .setTitle(`${EMOJIS.match} matched with ${matched.username}`)
    .addFields(
      { name: 'compatibility', value: `**${compat}%**\n${heartBar}`, inline: false },
      { name: 'their vibe',    value: `**${vibe}**`,                  inline: true },
      { name: 'star energy',   value: sign,                           inline: true },
      { name: 'why you match', value: `> *"${reason}"*`,              inline: false },
    )
    .setFooter(luvFooter(client));
}

// ── Crush embed ────────────────────────────────────────────────────────────────
export function crushEmbed({ target, isMutual, existing, client }) {
  if (isMutual) {
    return luvEmbed(COLORS.rose)
      .setTitle(`${EMOJIS.heart} it's mutual 💞`)
      .setThumbnail(target?.displayAvatarURL({ dynamic: true }) ?? null)
      .setDescription(
        `you and **${target?.username ?? 'them'}** both chose each other.\n\n` +
        `> *don't waste it ✦*`
      )
      .setFooter(luvFooter(client));
  }

  return luvEmbed(COLORS.purple)
    .setTitle(`${EMOJIS.heart} crush set ✦`)
    .setThumbnail(target?.displayAvatarURL({ dynamic: true }) ?? null)
    .setDescription(
      `your feelings for **${target?.username ?? 'them'}** are safe.\n` +
      `they won't know unless they choose you too ✦`
    )
    .setFooter(luvFooter(client));
}

// ── Confession card embed ──────────────────────────────────────────────────────
export function confessionEmbed({ text, targetName, revealed, revealedBy, client }) {
  const desc = targetName
    ? `*to ${targetName}:*\n\n> *"${text}"*`
    : `> *"${text}"*`;

  const embed = luvEmbed(COLORS.purple)
    .setTitle(`${EMOJIS.confession} anonymous confession ✦`)
    .setDescription(desc)
    .setFooter(luvFooter(client, revealed ? `revealed by ${revealedBy}` : 'identity hidden'));

  return embed;
}

// ── Rank card embed ────────────────────────────────────────────────────────────
export function rankEmbed({ user, discordUser, hearts, client }) {
  const { current, next } = getLevelData(user.xp ?? 0);
  const xpBar = getXpBar(user.xp ?? 0, current, next);

  return luvEmbed(current.color)
    .setAuthor({
      name:    `${discordUser.username}'s rank ✦`,
      iconURL: discordUser.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(discordUser.displayAvatarURL({ size: 256, dynamic: true }))
    .addFields(
      { name: `${EMOJIS.rank} level`,    value: `**${current.level}**`,                      inline: true },
      { name: `${EMOJIS.sparkle} title`, value: `*${current.title}*`,                        inline: true },
      { name: `${EMOJIS.streak} streak`, value: `**${user.streak ?? 0}** days 🔥`,            inline: true },
      { name: `${EMOJIS.fire} progress`, value: `\`${xpBar}\``,                              inline: false },
      { name: `${EMOJIS.heart} hearts`,  value: `**${hearts}** 💗`,                           inline: true },
      { name: 'total xp',               value: `**${user.xp ?? 0}**`,                        inline: true },
      {
        name:  next ? 'next level' : 'status',
        value: next ? `**${next.title}** at ${next.xp.toLocaleString()} xp` : '**max level** 👑',
        inline: true,
      },
    )
    .setFooter(luvFooter(client));
}

// ── Chemistry embed ────────────────────────────────────────────────────────────
export function chemEmbed({ author, target, score, label, bar, client }) {
  return luvEmbed(COLORS.aura)
    .setAuthor({
      name:    `${author.username} × ${target.username}`,
      iconURL: author.displayAvatarURL({ dynamic: true }),
    })
    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
    .setTitle(`${EMOJIS.chemistry} chemistry check ✦`)
    .addFields(
      { name: 'connection', value: `**${label}**`,                   inline: false },
      { name: 'meter',      value: `\`${bar}\`  **${score}**/200`,   inline: false },
      {
        name:  'insight',
        value: score < 20
          ? '> *keep interacting to build your chemistry ✦*'
          : '> *you two have something real ✦*',
      },
    )
    .setFooter(luvFooter(client));
}

// ── Midnight embed ─────────────────────────────────────────────────────────────
export function midnightEmbed({ isLateNight, prompt, comfort, client }) {
  return luvEmbed(COLORS.midnight)
    .setAuthor({ name: `midnight mode ✦ ${isLateNight ? '🌙' : '🕯️'}` })
    .setTitle(isLateNight ? "it's late. you're still up." : 'wherever you are, luvly is here ✦')
    .addFields(
      { name: "tonight's prompt", value: `> *"${prompt}"*`,   inline: false },
      { name: 'a reminder',       value: `> *"${comfort}"*`,  inline: false },
    )
    .setFooter(luvFooter(client));
}

// ── Rizz embed ─────────────────────────────────────────────────────────────────
export function rizzEmbed({ line, target, client }) {
  const desc = target
    ? `*sending this to **${target.username}** ✦*\n\n> *"${line}"*`
    : `> *"${line}"*`;

  return luvEmbed(COLORS.aura)
    .setTitle(`${EMOJIS.rizz} rizz generator ✦`)
    .setDescription(desc)
    .setFooter(luvFooter(client));
}

// ── Leaderboard embed ──────────────────────────────────────────────────────────
export function leaderboardEmbed({ lines, client }) {
  return luvEmbed(COLORS.gold)
    .setTitle(`${EMOJIS.crown} top aura holders ✦`)
    .setDescription(lines.join('\n\n'))
    .setFooter(luvFooter(client, 'updated live'));
}

// ── Daily claim embed ──────────────────────────────────────────────────────────
export function dailyEmbed({ streak, xp, hearts, client }) {
  return luvEmbed(COLORS.gold)
    .setTitle(`${EMOJIS.streak} daily claimed ✦`)
    .addFields(
      { name: 'xp earned', value: `**+${xp} xp**`,          inline: true },
      { name: 'hearts',    value: `**+${hearts} 💗**`,       inline: true },
      { name: 'streak',    value: `**${streak} days** 🔥`,   inline: true },
    )
    .setFooter(luvFooter(client));
}

// ── Ghost embed ────────────────────────────────────────────────────────────────
export function ghostEmbed({ target, days, level, bar, msgFn, client }) {
  return luvEmbed(COLORS.neutral)
    .setTitle(`${EMOJIS.ghost} ghost detector ✦`)
    .setAuthor({
      name:    target.username,
      iconURL: target.displayAvatarURL({ dynamic: true }),
    })
    .setDescription(msgFn(days))
    .addFields(
      { name: 'ghost level', value: `**${level}**`,  inline: true },
      { name: 'days silent', value: `**${days}**`,   inline: true },
      { name: 'ghost aura',  value: bar || DASH,     inline: false },
    )
    .setFooter(luvFooter(client));
}
