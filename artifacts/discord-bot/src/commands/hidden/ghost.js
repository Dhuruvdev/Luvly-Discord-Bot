import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getGhostDays, getUser, saveUser } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

const GHOST_MSGS = [
  (d) => `you disappeared for **${d} day${d !== 1 ? 's' : ''}**. ghost aura: **rising** 👻`,
  (d) => `**${d} days** of silence. the chat misses you. or maybe it doesn't. 💀`,
  (d) => `officially ghosting for **${d} day${d !== 1 ? 's' : ''}**. the respect is immaculate. 👻`,
];

export default {
  name: 'ghost',
  aliases: [],
  description: 'check how long someone has been ghosting',
  category: 'hidden',
  usage: 'ghost [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const days   = getGhostDays(target.id);

    const baseRow = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '💌', style: ButtonStyle.Primary },
      { id: 'comfort_more',     label: 'comfort me',    emoji: '🌙', style: ButtonStyle.Secondary },
    );

    if (days === 0) {
      const text =
        `**﹕ⵌ┆ ${EMOJIS.ghost} Ghost Detector ꩜ .**\n\n` +
        `**${target.username}** is not a ghost. they're right here 💀`;
      return await message.reply({ flags: CV2, components: [luvContainer(text, baseRow)] });
    }

    if (target.id !== message.author.id) {
      const caller = getUser(message.author.id);
      const count  = (caller.ghostCalls ?? 0) + 1;
      saveUser(message.author.id, { ghostCalls: count });
      if (count >= 3) await unlock(message.author.id, 'ghost_hunter', client);
    }

    const ghostLevel = days > 30 ? 'legendary' : days > 14 ? 'serious' : days > 7 ? 'moderate' : 'low';
    const ghostBar   = '👻'.repeat(Math.min(Math.ceil(days / 3), 10));
    const msgFn      = GHOST_MSGS[Math.floor(Math.random() * GHOST_MSGS.length)];

    const text =
      `**﹕ⵌ┆ ${EMOJIS.ghost} Ghost Detector ꩜ .**\n\n` +
      `__${target.username}__ — ${msgFn(days)}\n\n` +
      `${R} **Ghost Status:**\n` +
      `> ⤿  Ghost Level: **${ghostLevel}**\n` +
      `> ⤿  Days Silent: **${days}**\n` +
      `> ⤿  Ghost Aura: ${ghostBar || '—'}`;

    await message.reply({ flags: CV2, components: [luvContainer(text, baseRow)] });
  },
};
