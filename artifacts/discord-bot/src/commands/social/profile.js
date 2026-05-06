import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, getLevelData, getXpBar } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getUser, getHearts, saveUser } from '../../utils/database.js';
import { getUserAchievements, unlock } from '../../utils/achievements.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'profile',
  aliases: ['p'],
  description: "view yours or someone's profile",
  category: 'social',
  usage: 'profile [@user]',
  cooldown: 3_000,

  async execute(message, args, client) {
    const target   = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const user     = getUser(target.id);
    const hearts   = getHearts(target.id);
    const unlocked = getUserAchievements(target.id);
    const isSelf   = target.id === message.author.id;
    const { current, next } = getLevelData(user.xp ?? 0);
    const xpBar = getXpBar(user.xp ?? 0, current, next);

    if (!isSelf) {
      saveUser(target.id, { profileViews: (user.profileViews ?? 0) + 1 });
      await unlock(message.author.id, 'profile_viewer', client).catch(() => {});
    }

    const recentAch = unlocked.slice(-3).map(a => a.emoji).join('  ') || '—';
    const badgeStr  = user.badges?.length ? user.badges.join(' ') : '';
    const interests = user.interests?.length ? user.interests.map(i => `\`${i}\``).join('  ') : '*none listed*';
    const bio       = user.bio ? `> *"${user.bio}"*` : '> *no bio yet — add one with* `u profile edit`';
    const nextLevel = next ? `**${next.title}** at ${next.xp.toLocaleString()} xp` : '**max level** ';

    const text =
      `**﹕ⵌ┆ ${EMOJIS.star} ${target.username} ꩜ .**\n\n` +
      `${bio}\n\n` +
      `${R} **Aura & Identity:**\n` +
      `> ⤿  Aura: **${user.aura ?? 'soft'}**  ·  Pronouns: **${user.pronouns ?? 'not set'}**\n\n` +
      `${R} **Level & Progress:**\n` +
      `> ⤿  Level: **${current.level}** — *${current.title}*\n` +
      `> ⤿  XP: \`${xpBar}\`\n` +
      `> ⤿  Next: ${nextLevel}\n\n` +
      `${R} **Stats:**\n` +
      `> ⤿  Hearts: **${hearts}**   ·  Streak: **${user.streak ?? 0}** days \n` +
      `> ⤿  Profile Views: **${user.profileViews ?? 0}**\n\n` +
      `${R} **Interests:** ${interests}\n\n` +
      `${R} **Achievements:** ${recentAch}${unlocked.length ? `  *(${unlocked.length} total)*` : ''}` +
      (badgeStr ? `\n\n${R} **Badges:** ${badgeStr}` : '');

    const container = luvContainer(text);

    if (isSelf) {
      container.addActionRowComponents(buildButtons(
        { id: 'profile_edit', label: 'edit profile', emoji: '', style: ButtonStyle.Primary },
        { id: 'profile_aura', label: 'change aura',  emoji: '', style: ButtonStyle.Secondary },
        { id: 'daily_claim',  label: 'claim daily',  emoji: '', style: ButtonStyle.Success },
      ));
    }

    await message.reply({ flags: CV2, components: [container] });
  },
};
