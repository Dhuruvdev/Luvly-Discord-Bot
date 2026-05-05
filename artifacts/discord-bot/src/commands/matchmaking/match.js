import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';

const VIBES = ['soft', 'ethereal', 'magnetic', 'chaotic', 'midnight', 'golden', 'mysterious'];
const SIGNS = ['♈ aries', '♉ taurus', '♊ gemini', '♋ cancer', '♌ leo', '♍ virgo', '♎ libra', '♏ scorpio', '♐ sagittarius', '♑ capricorn', '♒ aquarius', '♓ pisces'];
const REASONS = [
  'you both carry the same quiet energy',
  'your vibes are eerily similar at 2am',
  'the universe keeps putting you in the same orbit',
  'your energy complements each other perfectly',
  "there's an unspoken chemistry the algorithm detected",
];

function randomMatch(guild) {
  const members = guild.members.cache.filter(m => !m.user.bot).map(m => m.user);
  return members[Math.floor(Math.random() * members.length)];
}

export default {
  name: 'match',
  aliases: ['findmatch'],
  description: 'get a daily match recommendation',
  category: 'matchmaking',
  usage: 'match',

  async execute(message, args, client) {
    const matched = randomMatch(message.guild);
    const compat  = 60 + Math.floor(Math.random() * 40);
    const hearts  = Math.round(compat / 10);
    const heartBar = '❤️'.repeat(hearts) + '🤍'.repeat(10 - hearts);
    const vibe   = VIBES[Math.floor(Math.random() * VIBES.length)];
    const sign   = SIGNS[Math.floor(Math.random() * SIGNS.length)];
    const reason = REASONS[Math.floor(Math.random() * REASONS.length)];

    addXP(message.author.id, 5);

    const embed = luvEmbed(COLORS.primary)
      .setAuthor({ name: `${message.author.username}'s daily match ✦`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(matched?.displayAvatarURL({ size: 256, dynamic: true }) ?? null)
      .setTitle(`${EMOJIS.match} matched with ${matched?.username ?? 'a mysterious stranger'}`)
      .addFields(
        { name: 'compatibility', value: `**${compat}%**\n${heartBar}`, inline: false },
        { name: 'their vibe',    value: `**${vibe}**`,                  inline: true },
        { name: 'star energy',   value: sign,                           inline: true },
        { name: 'why you match', value: `> *"${reason}"*`,              inline: false },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'match_again', label: 'try another', emoji: '🔄', style: ButtonStyle.Secondary },
      { id: 'match_crush', label: 'set as crush', emoji: '💌', style: ButtonStyle.Primary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
