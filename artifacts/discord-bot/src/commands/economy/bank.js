import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import {
  deposit, withdraw, getWallet, getBank, getLoan,
  accrueInterest, getEconomy, fmt,
} from '../../utils/economy.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'bank',
  aliases: ['dep', 'deposit', 'with', 'withdraw', 'savings'],
  description: 'deposit, withdraw, or check your bank',
  category: 'economy',
  usage: 'bank [dep <amount>|with <amount>]',
  cooldown: 3_000,

  async execute(message, args, client) {
    const sub    = args[0]?.toLowerCase();
    const userId = message.author.id;

    accrueInterest(userId);
    const eco    = getEconomy();
    const wallet = getWallet(userId);
    const bank   = getBank(userId);
    const loan   = getLoan(userId);

    const backRow = buildButtons(
      { id: 'eco_deposit',  label: 'deposit',  emoji: '🏦', style: ButtonStyle.Primary },
      { id: 'eco_withdraw', label: 'withdraw', emoji: '👛', style: ButtonStyle.Secondary },
      { id: 'eco_bal',      label: 'balance',  emoji: '📊', style: ButtonStyle.Secondary },
    );

    if (!sub || (sub !== 'dep' && sub !== 'deposit' && sub !== 'with' && sub !== 'withdraw')) {
      const frozen = loan > bank * 2 && loan > 0;
      const text =
        `**﹕ⵌ┆ 🏦 Luvly Bank ꩜ .**\n\n` +
        (frozen
          ? `⚠️ **account frozen** — your loan exceeds 2× your bank balance. repay debt to unfreeze.\n\n`
          : `> *your bank grows at **${(eco.savingsRate * 100).toFixed(2)}%/day** — safe from robbery*\n\n`) +
        `${R} **Balances:**\n` +
        `> ⤿  👛 Wallet: **${fmt(wallet)}**\n` +
        `> ⤿  🏦 Bank: **${fmt(bank)}**\n` +
        `> ⤿  ${loan > 0 ? '🔴 Loan' : '✅ Debt'}: ${loan > 0 ? `**${fmt(loan)}**` : 'none'}\n\n` +
        `${R} **Rates:**\n` +
        `> ⤿  📈 Savings Rate: ${(eco.savingsRate * 100).toFixed(2)}%/day\n` +
        `> ⤿  📊 Inflation: ×${eco.inflation.toFixed(3)}\n` +
        `> ⤿  🏠 Loan APR: ${(eco.baseInterestRate * 100).toFixed(1)}%`;
      return message.reply({ flags: CV2, components: [luvContainer(text, backRow)] });
    }

    const rawAmt = args[1];
    let amount;
    if (rawAmt === 'all') {
      amount = (sub === 'dep' || sub === 'deposit') ? wallet : bank;
    } else if (rawAmt === 'half') {
      amount = Math.floor(((sub === 'dep' || sub === 'deposit') ? wallet : bank) / 2);
    } else {
      amount = parseInt(rawAmt ?? '', 10);
    }

    if (!amount || amount < 1) {
      return message.reply({ flags: CV2, components: [luvContainer('> ⚠️ specify amount — `u bank dep 500` or `u bank dep all` ✦', backRow)] });
    }

    if (sub === 'dep' || sub === 'deposit') {
      const result = deposit(userId, amount);
      if (!result.success) {
        return message.reply({ flags: CV2, components: [luvContainer(`> ⚠️ not enough in wallet! you have **${fmt(wallet)}** ✦`, backRow)] });
      }
      const text =
        `**﹕ⵌ┆ 🏦 Deposited ꩜ .**\n\n` +
        `safely stashed **${fmt(amount)}** in your bank 💌\n\n` +
        `${R} **Updated Balances:**\n` +
        `> ⤿  👛 Wallet: **${fmt(result.wallet)}**\n` +
        `> ⤿  🏦 Bank: **${fmt(result.bank)}**\n` +
        `> ⤿  📈 Earns: ${(eco.savingsRate * 100).toFixed(2)}%/day`;
      const row = buildButtons(
        { id: 'eco_withdraw', label: 'withdraw', emoji: '👛', style: ButtonStyle.Secondary },
        { id: 'eco_bal',      label: 'balance',  emoji: '📊', style: ButtonStyle.Primary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    const result = withdraw(userId, amount);
    if (!result.success) {
      if (result.reason === 'frozen') {
        return message.reply({
          flags: CV2,
          components: [luvContainer(`> 🔒 account frozen! loan (**${fmt(result.loan)}**) > 2× bank (**${fmt(result.bank)}**). repay debt first ✦`, backRow)],
        });
      }
      return message.reply({ flags: CV2, components: [luvContainer(`> ⚠️ not enough in bank! you have **${fmt(bank)}** ✦`, backRow)] });
    }

    const text =
      `**﹕ⵌ┆ 💸 Withdrawn ꩜ .**\n\n` +
      `moved **${fmt(amount)}** to your wallet\n\n` +
      `${R} **Updated Balances:**\n` +
      `> ⤿  👛 Wallet: **${fmt(result.wallet)}**\n` +
      `> ⤿  🏦 Bank: **${fmt(result.bank)}**`;
    const row = buildButtons(
      { id: 'eco_deposit', label: 'deposit back', emoji: '🏦', style: ButtonStyle.Secondary },
      { id: 'eco_gamble',  label: 'gamble',       emoji: '🎰', style: ButtonStyle.Primary },
      { id: 'eco_bal',     label: 'balance',      emoji: '📊', style: ButtonStyle.Secondary },
    );
    return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
