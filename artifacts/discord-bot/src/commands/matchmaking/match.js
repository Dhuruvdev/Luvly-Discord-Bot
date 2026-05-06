import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

const VIBES   = ['soft', 'ethereal', 'magnetic', 'chaotic', 'midnight', 'golden', 'mysterious'];
const SIGNS   = [' aries', ' taurus', ' gemini', ' cancer', ' leo', ' virgo', ' libra', ' scorpio', ' sagittarius', ' capricorn', ' aquarius', ' pisces'];
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
    const matched  = randomMatch(message.guild);
    const compat   = 60 + Math.floor(Math.random() * 40);
    const hearts   = Math.round(compat / 10);
    const heartBar = ''.repeat(hearts) + ''.repeat(10 - hearts);
    const vibe     = VIBES[Math.floor(Math.random() * VIBES.length)];
    const sign     = SIGNS[Math.floor(Math.random() * SIGNS.length)];
    const reason   = REASONS[Math.floor(Math.random() * REASONS.length)];

    addXP(message.author.id, 5);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.match} Daily Match ꩜ .**\n\n` +
      `> *"${reason}"*\n\n` +
      `${R} **Your Match:**\n` +
      `> ⤿  Matched with: **${matched?.username ?? 'a mysterious stranger'}**\n` +
      `> ⤿  Compatibility: **${compat}%**\n` +
      `> ⤿  Heart score: ${heartBar}\n` +
      `> ⤿  Their vibe: **${vibe}**  ·  Star energy: ${sign}`;

    const row = buildButtons(
      { id: 'match_again', label: 'try another',  emoji: '', style: ButtonStyle.Secondary },
      { id: 'match_crush', label: 'set as crush', emoji: '', style: ButtonStyle.Primary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
