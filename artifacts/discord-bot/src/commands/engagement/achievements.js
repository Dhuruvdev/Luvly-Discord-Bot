import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, footer } from '../../utils/embeds.js';
import { getUserAchievements, ACHIEVEMENTS } from '../../utils/achievements.js';
import { getHearts } from '../../utils/database.js';

export default {
  name: 'achievements',
  aliases: ['ach', 'badges'],
  description: 'view your unlocked achievements',
  category: 'engagement',
  usage: 'achievements [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target   = message.mentions.users.first() ?? message.author;
    const unlocked = getUserAchievements(target.id);
    const total    = Object.keys(ACHIEVEMENTS).length;
    const hearts   = getHearts(target.id);
    const pct      = Math.round((unlocked.length / total) * 100);
    const bar      = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));

    const lockedIds  = Object.keys(ACHIEVEMENTS).filter(id => !unlocked.find(a => a.id === id));
    const nextHints  = lockedIds.slice(0, 3).map(id => {
      const a = ACHIEVEMENTS[id];
      return `${a.emoji} *${a.name}* — ${a.desc}`;
    });

    const embed = luvEmbed(COLORS.gold)
      .setAuthor({ name: `${target.username}'s achievements ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setDescription(
        unlocked.length
          ? unlocked.map(a => `${a.emoji} **${a.name}** — *${a.desc}*`).join('\n')
          : '> *no achievements yet — start exploring luvly ✦*'
      )
      .addFields(
        { name: 'progress',         value: `\`${bar}\` **${unlocked.length}/${total}** (${pct}%)` },
        { name: `${EMOJIS.heart} hearts`, value: `**${hearts}** 💗`, inline: true },
        { name: 'up next',          value: nextHints.length ? nextHints.join('\n') : '*all unlocked!* 🏆' },
      )
      .setFooter(footer(client));

    await message.reply({ embeds: [embed] });
  },
};
