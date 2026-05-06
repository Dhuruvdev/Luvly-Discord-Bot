import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getEcoUser, getNetWorth, fmt, accrueInterest, getEconomy, trendEmoji, inflationLabel } from '../../utils/economy.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

function makeBar(val, max, len = 15) {
  const filled = Math.max(0, Math.min(len, Math.round((val / max) * len)));
  return '█'.repeat(filled) + '░'.repeat(len - filled);
}

export default {
  name: 'balance',
  aliases: ['bal', 'wallet', 'cowoncy', 'luv', 'money', 'worth'],
  description: 'check your luv balance, bank, and net worth',
  category: 'economy',
  usage: 'balance [@user]',
  cooldown: 3_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const isSelf = target.id === message.author.id;

    accrueInterest(target.id);
    const u   = getEcoUser(target.id);
    const eco = getEconomy();
    const net = getNetWorth(target.id);

    const wallet = u.wallet ?? 0;
    const bank   = u.bank   ?? 0;
    const loan   = u.loan   ?? 0;

    const walletBar = makeBar(wallet, Math.max(wallet + bank, 1000));
    const bankBar   = makeBar(bank,   Math.max(wallet + bank, 1000));
    const loanInfo  = loan > 0
      ? `\n>  **loan outstanding:** ${fmt(loan)} @ ${(u.loanRate * 365 * 100).toFixed(1)}% APR`
      : '';

    const text =
      `**﹕ⵌ┆  ${target.username}'s Luv Wallet ꩜ .**\n\n` +
      `${trendEmoji(eco.marketTrend)} market is **${eco.marketTrend}** · ${inflationLabel(eco.inflation)}${loanInfo}\n\n` +
      `${R} **Wallet:**\n` +
      `> ⤿  ${fmt(wallet)}\n` +
      `> ⤿  \`${walletBar}\`\n\n` +
      `${R} **Bank:**\n` +
      `> ⤿  ${fmt(bank)}\n` +
      `> ⤿  \`${bankBar}\`\n\n` +
      `${R} **Overview:**\n` +
      `> ⤿  Net Worth: **${fmt(net)}**\n` +
      `> ⤿  Debt: ${loan > 0 ? `**${fmt(loan)}**` : 'none'}\n` +
      `> ⤿  Savings Rate: ${(eco.savingsRate * 100).toFixed(2)}%/day`;

    const row = isSelf
      ? buildButtons(
          { id: 'eco_work',    label: 'work',        emoji: '', style: ButtonStyle.Primary },
          { id: 'eco_deposit', label: 'deposit all', emoji: '', style: ButtonStyle.Secondary },
          { id: 'daily_claim', label: 'daily',       emoji: '', style: ButtonStyle.Success },
        )
      : buildButtons(
          { id: 'eco_market',  label: 'market',      emoji: '', style: ButtonStyle.Secondary },
          { id: 'daily_claim', label: 'daily',       emoji: '', style: ButtonStyle.Primary },
        );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
