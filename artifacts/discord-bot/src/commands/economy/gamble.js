import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getWallet, removeFromWallet, addToWallet, fmt, getEconomy } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

const SYMBOLS = [
  { s: '🍒', w: 30, mult: 1.5  },
  { s: '🍋', w: 25, mult: 2.0  },
  { s: '🍇', w: 20, mult: 2.5  },
  { s: '⭐', w: 12, mult: 4.0  },
  { s: '💎', w:  8, mult: 8.0  },
  { s: '💗', w:  4, mult: 15.0 },
  { s: '🌸', w:  1, mult: 50.0 },
];

function spin() {
  const total = SYMBOLS.reduce((s, x) => s + x.w, 0);
  const pick  = () => {
    let r = Math.random() * total;
    for (const sym of SYMBOLS) { r -= sym.w; if (r <= 0) return sym; }
    return SYMBOLS[0];
  };
  return [pick(), pick(), pick()];
}

export default {
  name: 'gamble',
  aliases: ['slots', 'bet', 'spin', 'casino'],
  description: 'spin the slots and gamble your luv',
  category: 'economy',
  usage: 'gamble <amount|all|half>',
  cooldown: 8_000,

  async execute(message, args, client) {
    const userId = message.author.id;
    const wallet = getWallet(userId);
    const eco    = getEconomy();

    const errorRow = buildButtons(
      { id: 'eco_work', label: 'earn luv first', emoji: '💼', style: ButtonStyle.Primary },
      { id: 'eco_bal',  label: 'balance',        emoji: '👛', style: ButtonStyle.Secondary },
    );

    const raw = args[0]?.toLowerCase();
    let amount;
    if (raw === 'all')       amount = wallet;
    else if (raw === 'half') amount = Math.floor(wallet / 2);
    else                     amount = parseInt(raw ?? '', 10);

    if (!amount || amount < 1)
      return message.reply({ flags: CV2, components: [luvContainer('> ⚠️ specify an amount — `u gamble 100` or `u gamble all` ✦', errorRow)] });
    if (amount > wallet)
      return message.reply({ flags: CV2, components: [luvContainer(`> ⚠️ not enough in wallet! you have **${fmt(wallet)}** ✦`, errorRow)] });
    if (amount > 100_000)
      return message.reply({ flags: CV2, components: [luvContainer('> ⚠️ max bet is 100,000 luv per spin ✦', errorRow)] });

    const houseEdge = Math.min(0.20, 0.08 + (eco.inflation - 1) * 0.15);
    removeFromWallet(userId, amount);

    const reels = spin();
    const [r0, r1, r2] = reels;
    const s1 = r0.s, s2 = r1.s, s3 = r2.s;

    let winMult = 0;
    let resultLine = '';

    if (s1 === s2 && s2 === s3) {
      winMult    = r0.mult * 3;
      resultLine = `🎰 **JACKPOT!** triple ${s1}!`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      const matched = s1 === s2 ? r0 : s2 === s3 ? r1 : r0;
      winMult    = matched.mult * 0.8;
      resultLine = `✨ **pair!** two ${matched.s}s`;
    } else {
      resultLine = '💔 **no match** — better luck next time';
    }

    const grossWin = Math.floor(amount * winMult);
    const netWin   = Math.floor(grossWin * (1 - houseEdge));
    if (netWin > 0) { addToWallet(userId, netWin); addXP(userId, 5); }

    const profit = netWin - amount;
    const won    = netWin > 0;

    const text =
      `**﹕ⵌ┆ 🎰 Luvly Slots ꩜ .**\n\n` +
      `**[ ${s1}  ${s2}  ${s3} ]**\n\n` +
      `${resultLine}\n` +
      (eco.inflation > 1.10 ? `\n> 📈 *inflation house edge: ${(houseEdge * 100).toFixed(1)}%*\n` : '') +
      `\n${R} **Result:**\n` +
      `> ⤿  🎯 Bet: **${fmt(amount)}**\n` +
      `> ⤿  ${won ? '🏆 Won' : '💸 Lost'}: **${fmt(won ? netWin : amount)}**\n` +
      `> ⤿  ${won ? '📈 Profit' : '📉 Loss'}: **${fmt(Math.abs(profit))}**\n` +
      `> ⤿  👛 Wallet: **${fmt(getWallet(userId))}**\n` +
      `> ⤿  🏠 Edge: ${(houseEdge * 100).toFixed(1)}%`;

    const row = buildButtons(
      { id: 'eco_gamble',  label: 'spin again',    emoji: '🎰', style: ButtonStyle.Primary },
      { id: 'eco_deposit', label: 'bank winnings', emoji: '🏦', style: ButtonStyle.Success },
      { id: 'eco_bal',     label: 'balance',       emoji: '👛', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
