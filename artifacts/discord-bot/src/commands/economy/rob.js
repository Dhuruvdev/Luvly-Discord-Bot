import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { rob, getWallet, getEcoUser, fmt } from '../../utils/economy.js';
import { isBlocked } from '../../utils/database.js';

const R         = '<:right:1501255316350959858>';
const CV2       = MessageFlags.IsComponentsV2;
const COOLDOWN_MS = 60 * 60 * 1_000;

const SUCCESS_LINES = [
  'you slipped through the shadows undetected',
  'five-finger discount applied successfully',
  'they never saw it coming',
  'smooth criminal behaviour',
  "the universe redistributed some wealth",
];

const CAUGHT_LINES = [
  'you tripped over their cat on the way out',
  'they heard you coming from a mile away',
  'a nearby pigeon sold you out',
  'you forgot to turn off your notification sounds',
  'karma said absolutely not',
];

export default {
  name: 'rob',
  aliases: ['steal', 'mug'],
  description: "rob someone's wallet (risky!)",
  category: 'economy',
  usage: 'rob @user',
  cooldown: 0,

  async execute(message, args, client) {
    const target  = message.mentions.users.filter(u => !u.bot).first();
    const baseRow = buildButtons(
      { id: 'eco_bal',  label: 'my balance',  emoji: '👛', style: ButtonStyle.Primary },
      { id: 'eco_work', label: 'work for it', emoji: '💼', style: ButtonStyle.Secondary },
    );

    if (!target)
      return message.reply({ flags: CV2, components: [luvContainer('> ⚠️ mention someone to rob ✦', baseRow)] });
    if (target.id === message.author.id)
      return message.reply({ flags: CV2, components: [luvContainer("⚠️ you can't rob yourself 💀", baseRow)] });
    if (isBlocked(message.author.id, target.id))
      return message.reply({ flags: CV2, components: [luvContainer("⚠️ you can't interact with this user ✦", baseRow)] });

    const u   = getEcoUser(message.author.id);
    const now = Date.now();
    if ((now - (u.lastRob ?? 0)) < COOLDOWN_MS) {
      const left = COOLDOWN_MS - (now - (u.lastRob ?? 0));
      const text =
        `**﹕ⵌ┆ ${EMOJIS.ghost} Lay Low ꩜ .**\n\n` +
        `police are still looking for you.\n\n` +
        `> ⏳ try again in **${Math.ceil(left / 60_000)} min**`;
      return message.reply({ flags: CV2, components: [luvContainer(text, baseRow)] });
    }

    const victimWallet = getWallet(target.id);
    if (victimWallet < 50) {
      const text =
        `**﹕ⵌ┆ ${EMOJIS.ghost} Not Worth It ꩜ .**\n\n` +
        `**${target.username}** only has **${fmt(victimWallet)}** in their wallet.\n` +
        `> *not worth the risk — they're broker than you ✦*`;
      return message.reply({ flags: CV2, components: [luvContainer(text, baseRow)] });
    }

    const result = rob(message.author.id, target.id);

    if (result.success) {
      const line = SUCCESS_LINES[Math.floor(Math.random() * SUCCESS_LINES.length)];
      const text =
        `**﹕ⵌ┆ ${EMOJIS.ghost} Successful Robbery ꩜ .**\n\n` +
        `*${line}*\n\n` +
        `${R} **Haul:**\n` +
        `> ⤿  💸 Stolen from: **${target.username}**\n` +
        `> ⤿  💰 Haul: **${fmt(result.stolen)}**\n` +
        `> ⤿  👛 Your Wallet: **${fmt(getWallet(message.author.id))}**`;
      const row = buildButtons(
        { id: 'eco_deposit', label: 'stash it', emoji: '🏦', style: ButtonStyle.Primary },
        { id: 'eco_bal',     label: 'balance',  emoji: '👛', style: ButtonStyle.Secondary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    if (result.reason === 'caught') {
      const line = CAUGHT_LINES[Math.floor(Math.random() * CAUGHT_LINES.length)];
      const text =
        `**﹕ⵌ┆ 🚨 Caught! ꩜ .**\n\n` +
        `*${line}*\n\n` +
        `> you paid **${fmt(result.fine)}** in fines\n\n` +
        `${R} **Fine:**\n` +
        `> ⤿  💸 Fine Paid: **${fmt(result.fine)}**\n` +
        `> ⤿  👛 Wallet: **${fmt(getWallet(message.author.id))}**`;
      const row = buildButtons(
        { id: 'eco_work', label: 'earn it back', emoji: '💼', style: ButtonStyle.Primary },
        { id: 'eco_bal',  label: 'balance',      emoji: '👛', style: ButtonStyle.Secondary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }
  },
};
