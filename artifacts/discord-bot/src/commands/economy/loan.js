import { ButtonStyle } from 'discord.js';
import { COLORS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import {
  takeLoan, repayLoan, getLoan, getLoanRate,
  getWallet, getBank, accrueInterest, getEcoUser, getEconomy, fmt,
} from '../../utils/economy.js';

const MAX_LOAN = 50_000;

export default {
  name: 'loan',
  aliases: ['borrow', 'debt', 'repay', 'lend'],
  description: 'take or repay a loan (compound interest)',
  category: 'economy',
  usage: 'loan <amount> | repay <amount|all>',
  cooldown: 5_000,

  async execute(message, args, client) {
    const sub    = args[0]?.toLowerCase();
    const userId = message.author.id;

    accrueInterest(userId);
    const eco    = getEconomy();
    const u      = getEcoUser(userId);
    const loan   = getLoan(userId);
    const wallet = getWallet(userId);
    const bank   = getBank(userId);

    const loanAPR     = parseFloat((eco.baseInterestRate * 100).toFixed(2));
    const loanAPRAdj  = Math.min(30, loanAPR + (eco.inflation - 1) * 20);

    const backRow = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '👛', style: ButtonStyle.Primary },
      { id: 'eco_bank', label: 'bank info',  emoji: '🏦', style: ButtonStyle.Secondary },
    );

    // ── Repay ──────────────────────────────────────────────────────────────────
    if (sub === 'repay' || sub === 'pay') {
      if (loan <= 0) {
        return message.reply({ embeds: [errorEmbed("you have no outstanding loan ✦")], components: [backRow] });
      }
      const raw = args[1];
      const amount = raw === 'all' ? wallet : parseInt(raw ?? '', 10);
      if (!amount || amount < 1) {
        return message.reply({ embeds: [errorEmbed('specify amount — `u loan repay all` or `u loan repay 500` ✦')], components: [backRow] });
      }
      const result = repayLoan(userId, amount);
      if (!result.success) {
        if (result.reason === 'no_loan') return message.reply({ embeds: [errorEmbed('no loan to repay ✦')], components: [backRow] });
        return message.reply({ embeds: [errorEmbed(`not enough in wallet! you have **${fmt(result.balance)}** ✦`)], components: [backRow] });
      }
      const cleared = result.remaining === 0;
      const embed = luvEmbed(cleared ? COLORS.success : COLORS.primary)
        .setTitle(cleared ? '✅ loan cleared! ✦' : '💸 partial repayment ✦')
        .setDescription(
          cleared
            ? '> *your debt is fully paid off. financial freedom! ✦*'
            : `> *${fmt(result.remaining)} still outstanding — keep repaying to unfreeze your bank*`
        )
        .addFields(
          { name: '✅ paid',      value: `**${fmt(result.paid)}**`,      inline: true },
          { name: '🔴 remaining', value: `**${fmt(result.remaining)}**`, inline: true },
          { name: '👛 wallet',    value: `**${fmt(getWallet(userId))}**`, inline: true },
        )
        .setFooter(footer(client));
      const row = buildButtons(
        { id: 'eco_bal',   label: 'balance',     emoji: '👛', style: ButtonStyle.Primary },
        { id: 'eco_bank',  label: 'bank info',   emoji: '🏦', style: ButtonStyle.Secondary },
        { id: 'eco_work',  label: 'earn more',   emoji: '💼', style: ButtonStyle.Secondary },
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    // ── Loan overview (no amount given) ────────────────────────────────────────
    if (!sub || isNaN(parseInt(sub))) {
      const embed = luvEmbed(loan > 0 ? COLORS.rose : COLORS.gold)
        .setTitle('🏦 luvly loan desk ✦')
        .setDescription(
          loan > 0
            ? `⚠️ you have an **active loan of ${fmt(loan)}**\n> *use \`u loan repay <amount>\` to pay it down*`
            : '> *borrow luv now, repay with interest. compound interest applies daily.*'
        )
        .addFields(
          { name: '📊 current APR',    value: `**${loanAPRAdj.toFixed(1)}%**`, inline: true },
          { name: '📈 inflation rate', value: `×${eco.inflation.toFixed(3)}`,  inline: true },
          { name: '💰 max loan',       value: `**${fmt(MAX_LOAN)}**`,           inline: true },
          loan > 0
            ? { name: '🔴 your debt', value: `**${fmt(loan)}**`, inline: true }
            : { name: '✅ status',    value: 'no active loan',   inline: true },
        )
        .setFooter(footer(client));
      const row = buildButtons(
        loan > 0
          ? { id: 'eco_repay', label: `repay ${fmt(Math.min(wallet, loan))}`, emoji: '✅', style: ButtonStyle.Danger }
          : { id: 'eco_borrow', label: 'borrow 1000',                         emoji: '💳', style: ButtonStyle.Primary },
        { id: 'eco_work', label: 'earn instead', emoji: '💼', style: ButtonStyle.Secondary },
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    // ── Take loan ──────────────────────────────────────────────────────────────
    if (loan > 0) {
      return message.reply({
        embeds: [errorEmbed(`you already have an active loan of **${fmt(loan)}** — repay it first ✦`)],
        components: [backRow],
      });
    }

    const amount = parseInt(sub, 10);
    if (amount < 100)     return message.reply({ embeds: [errorEmbed('minimum loan is 100 luv ✦')], components: [backRow] });
    if (amount > MAX_LOAN) return message.reply({ embeds: [errorEmbed(`max loan is **${fmt(MAX_LOAN)}** ✦`)], components: [backRow] });

    const result = takeLoan(userId, amount);
    if (!result.success) {
      return message.reply({ embeds: [errorEmbed(`couldn't process loan — ${result.reason} ✦`)], components: [backRow] });
    }

    const embed = luvEmbed(COLORS.primary)
      .setTitle('💳 loan approved ✦')
      .setDescription(
        `**${fmt(result.amount)}** has been added to your wallet.\n\n` +
        `> ⚠️ *interest compounds daily at **${result.rate}% APR**\n` +
        `> if your debt exceeds 2× bank balance, withdrawals freeze*`
      )
      .addFields(
        { name: '💰 borrowed',   value: `**${fmt(result.amount)}**`,                   inline: true },
        { name: '📊 APR',        value: `**${result.rate}%**`,                         inline: true },
        { name: '👛 wallet now', value: `**${fmt(getWallet(userId))}**`,               inline: true },
      )
      .setFooter(footer(client));
    const row = buildButtons(
      { id: 'eco_bank',  label: 'bank it',   emoji: '🏦', style: ButtonStyle.Primary },
      { id: 'eco_work',  label: 'work',      emoji: '💼', style: ButtonStyle.Secondary },
      { id: 'eco_repay', label: 'repay now', emoji: '✅', style: ButtonStyle.Danger },
    );
    return message.reply({ embeds: [embed], components: [row] });
  },
};
