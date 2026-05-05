import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, getLevelData, getXpBar } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { getUser, getHearts, saveUser } from '../../utils/database.js';
import { getUserAchievements, unlock } from '../../utils/achievements.js';

export default {
  name: 'profile',
  aliases: ['p'],
  description: "view yours or someone's profile",
  category: 'social',
  usage: 'profile [@user]',
  cooldown: 3_000,

  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription("View your or someone else's Luvly profile")
    .addUserOption(o =>
      o.setName('user').setDescription('User to view (defaults to yourself)')
    ),

  async execute(message, args, client) {
    const target   = message.mentions.users.first() ?? message.author;
    const user     = getUser(target.id);
    const hearts   = getHearts(target.id);
    const unlocked = getUserAchievements(target.id);
    const isSelf   = target.id === message.author.id;
    const { current, next } = getLevelData(user.xp ?? 0);
    const xpBar = getXpBar(user.xp ?? 0, current, next);

    const auraColors = {
      soft:     COLORS.soft,
      ethereal: COLORS.purple,
      magnetic: COLORS.primary,
      chaotic:  COLORS.rose,
      midnight: COLORS.midnight,
      golden:   COLORS.gold,
    };

    if (!isSelf) {
      saveUser(target.id, { profileViews: (user.profileViews ?? 0) + 1 });
      await unlock(message.author.id, 'profile_viewer', client).catch(() => {});
    }

    const recentAch = unlocked.slice(-3).map(a => a.emoji).join('  ') || '—';
    const badgeStr  = user.badges?.length ? user.badges.join(' ') : '';

    const embed = luvEmbed(auraColors[user.aura] ?? COLORS.primary)
      .setAuthor({ name: `${target.username} ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(target.displayAvatarURL({ size: 256, dynamic: true }))
      .setDescription(user.bio ? `> *"${user.bio}"*` : '> *no bio yet — add one with* `u profile edit`')
      .addFields(
        { name: `${EMOJIS.star} aura`,        value: `**${user.aura ?? 'soft'}**`,                       inline: true },
        { name: `${EMOJIS.sparkle} pronouns`, value: user.pronouns ?? '*not set*',                       inline: true },
        { name: `${EMOJIS.rank} level`,       value: `**${current.level}** — *${current.title}*`,        inline: true },
        { name: `${EMOJIS.fire} progress`,    value: `\`${xpBar}\``,                                     inline: false },
        { name: `${EMOJIS.heart} hearts`,     value: `**${hearts}** 💗`,                                  inline: true },
        { name: `${EMOJIS.streak} streak`,    value: `**${user.streak ?? 0}** days 🔥`,                   inline: true },
        { name: '👀 profile views',            value: `**${user.profileViews ?? 0}**`,                    inline: true },
        {
          name:  `${EMOJIS.heart} interests`,
          value: user.interests?.length ? user.interests.map(i => `\`${i}\``).join('  ') : '*none listed*',
        },
        {
          name:  '🏅 achievements',
          value: recentAch + (unlocked.length ? `  *(${unlocked.length} total)*` : ''),
        },
      )
      .setFooter(footer(client));

    if (badgeStr) embed.addFields({ name: '🏷️ badges', value: badgeStr });

    const rows = [];
    if (isSelf) {
      rows.push(buildButtons(
        { id: 'profile_edit', label: 'edit profile', emoji: '✏️',  style: ButtonStyle.Primary },
        { id: 'profile_aura', label: 'change aura',  emoji: '🌸',  style: ButtonStyle.Secondary },
        { id: 'daily_claim',  label: 'claim daily',  emoji: '🎁',  style: ButtonStyle.Success },
      ));
    }

    await message.reply({ embeds: [embed], components: rows });
  },
};
