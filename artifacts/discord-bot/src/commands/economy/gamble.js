import { ButtonStyle } from 'discord.js';
import { COLORS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getWallet, removeFromWallet, addToWallet, fmt, getEconomy } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';

// Slot symbols & weights
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
    const userId  = message.author.id;
    const wallet  = getWallet(userId);
    const eco     = getEconomy();

    const errorRow = buildButtons(
      { id: 'eco_work', label: 'earn luv first', emoji: '💼', style: ButtonStyle.Primary },
      { id: 'eco_bal',  label: 'balance',        emoji: '👛', style: ButtonStyle.Secondary },
    );

    const raw = args[0]?.toLowerCase();
    let amount;
    if (raw === 'all')       amount = wallet;
    else if (raw === 'half') amount = Math.floor(wallet / 2);
    else                     amount = parseInt(raw ?? '', 10);

    if (!amount || amount < 1) {
      return message.reply({ embeds: [errorEmbed('specify an amount — `u gamble 100` or `u gamble all` ✦')], components: [errorRow] });
    }
    if (amount > wallet) {
      return message.reply({ embeds: [errorEmbed(`not enough in wallet! you have **${fmt(wallet)}** ✦`)], components: [errorRow] });
    }
    if (amount > 100_000) {
      return message.reply({ embeds: [errorEmbed('max bet is 100,000 luv per spin ✦')], components: [errorRow] });
    }

    // Inflation tax on gambling: house edge increases with inflation
    const houseEdge = Math.min(0.20, 0.08 + (eco.inflation - 1) * 0.15);

    removeFromWallet(userId, amount);

    const reels  = spin();
    const s1 = reels[0].s, s2 = reels[1].s, s3 = reels[2].s;

    let winMult = 0;
    let resultLine = '';

    if (s1 === s2 && s2 === s3) {
      // Jackpot — triple match
      winMult    = reels[0].mult * 3;
      resultLine = `🎰 **JACKPOT!** triple ${s1}!`;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      // Pair
      const matched = s1 === s2 ? reels[0] : s2 === s3 ? reels[1] : reels[0];
      winMult    = matched.mult * 0.8;
      resultLine = `✨ **pair!** two ${matched.s}s`;
    } else {
      resultLine = '💔 **no match** — better luck next time';
    }

    const grossWin = Math.floor(amount * winMult);
    const netWin   = Math.floor(grossWin * (1 - houseEdge));

    if (netWin > 0) {
      addToWallet(userId, netWin);
      addXP(userId, 5);
    }

    const profit = netWin - amount;
    const won    = netWin > 0;
    const color  = netWin > amount * 2 ? COLORS.gold : won ? COLORS.success : COLORS.rose;

    const embed = luvEmbed(color)
      .setTitle(`🎰 luvly slots ✦`)
      .setDescription(
        `**[ ${s1}  ${s2}  ${s3} ]**\n\n${resultLine}\n` +
        (eco.inflation > 1.10 ? `\n> 📈 *inflation house edge: ${(houseEdge * 100).toFixed(1)}%*` : '')
      )
      .addFields(
        { name: '🎯 bet',     value: `**${fmt(amount)}**`,               inline: true },
        { name: won ? '🏆 won' : '💸 lost', value: `**${fmt(won ? netWin : amount)}**`, inline: true },
        { name: won ? '📈 profit' : '📉 loss', value: `**${fmt(Math.abs(profit))}**`,   inline: true },
        { name: '👛 wallet',  value: `**${fmt(getWallet(userId))}**`,    inline: true },
        { name: '🏠 edge',    value: `${(houseEdge * 100).toFixed(1)}%`, inline: true },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'eco_gamble', label: 'spin again',  emoji: '🎰', style: ButtonStyle.Primary },
      { id: 'eco_deposit', label: 'bank winnings', emoji: '🏦', style: ButtonStyle.Success },
      { id: 'eco_bal',    label: 'balance',     emoji: '👛', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
