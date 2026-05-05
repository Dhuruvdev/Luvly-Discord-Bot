import { ButtonStyle } from 'discord.js';
import { COLORS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import {
  deposit, withdraw, getWallet, getBank, getLoan,
  accrueInterest, getEconomy, fmt, getEcoUser,
} from '../../utils/economy.js';

export default {
  name: 'bank',
  aliases: ['dep', 'deposit', 'with', 'withdraw', 'savings'],
  description: 'deposit, withdraw, or check your bank',
  category: 'economy',
  usage: 'bank [dep <amount>|with <amount>]',
  cooldown: 3_000,

  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    const userId = message.author.id;

    accrueInterest(userId);
    const eco    = getEconomy();
    const wallet = getWallet(userId);
    const bank   = getBank(userId);
    const loan   = getLoan(userId);

    const backRow = buildButtons(
      { id: 'eco_deposit',  label: 'deposit',   emoji: '🏦', style: ButtonStyle.Primary },
      { id: 'eco_withdraw', label: 'withdraw',  emoji: '👛', style: ButtonStyle.Secondary },
      { id: 'eco_bal',      label: 'balance',   emoji: '📊', style: ButtonStyle.Secondary },
    );

    // ── Bank overview (no subcommand) ──────────────────────────────────────────
    if (!sub || (sub !== 'dep' && sub !== 'deposit' && sub !== 'with' && sub !== 'withdraw')) {
      const frozen = loan > bank * 2 && loan > 0;
      const embed = luvEmbed(COLORS.gold)
        .setTitle('🏦 luvly bank ✦')
        .setDescription(
          frozen
            ? '⚠️ **account frozen** — your loan exceeds 2× your bank balance. repay debt to unfreeze.'
            : `> *your bank grows at **${(eco.savingsRate * 100).toFixed(2)}%/day** — safe from robbery*`
        )
        .addFields(
          { name: '👛 wallet',       value: `**${fmt(wallet)}**`, inline: true },
          { name: '🏦 bank',         value: `**${fmt(bank)}**`,   inline: true },
          { name: loan > 0 ? '🔴 loan' : '✅ debt', value: loan > 0 ? `**${fmt(loan)}**` : 'none', inline: true },
          { name: '📈 savings rate', value: `${(eco.savingsRate * 100).toFixed(2)}%/day`, inline: true },
          { name: '📊 inflation',    value: `×${eco.inflation.toFixed(3)}`,               inline: true },
          { name: '🏠 loan rate',    value: `${(eco.baseInterestRate * 100).toFixed(1)}% APR`, inline: true },
        )
        .setFooter(footer(client));
      return message.reply({ embeds: [embed], components: [backRow] });
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
      return message.reply({ embeds: [errorEmbed('specify amount — `u bank dep 500` or `u bank dep all` ✦')], components: [backRow] });
    }

    // ── Deposit ────────────────────────────────────────────────────────────────
    if (sub === 'dep' || sub === 'deposit') {
      const result = deposit(userId, amount);
      if (!result.success) {
        return message.reply({ embeds: [errorEmbed(`not enough in wallet! you have **${fmt(wallet)}** ✦`)], components: [backRow] });
      }
      const embed = luvEmbed(COLORS.success)
        .setTitle('🏦 deposited ✦')
        .setDescription(`safely stashed **${fmt(amount)}** in your bank 💌`)
        .addFields(
          { name: '👛 wallet', value: `**${fmt(result.wallet)}**`, inline: true },
          { name: '🏦 bank',   value: `**${fmt(result.bank)}**`,   inline: true },
          { name: '📈 earns',  value: `${(eco.savingsRate * 100).toFixed(2)}%/day`, inline: true },
        )
        .setFooter(footer(client));
      const row = buildButtons(
        { id: 'eco_withdraw', label: 'withdraw', emoji: '👛', style: ButtonStyle.Secondary },
        { id: 'eco_bal',      label: 'balance',  emoji: '📊', style: ButtonStyle.Primary },
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    // ── Withdraw ───────────────────────────────────────────────────────────────
    const result = withdraw(userId, amount);
    if (!result.success) {
      if (result.reason === 'frozen') {
        return message.reply({
          embeds: [errorEmbed(`🔒 account frozen! loan (**${fmt(result.loan)}**) > 2× bank (**${fmt(result.bank)}**). repay debt first ✦`)],
          components: [backRow],
        });
      }
      return message.reply({ embeds: [errorEmbed(`not enough in bank! you have **${fmt(bank)}** ✦`)], components: [backRow] });
    }

    const embed = luvEmbed(COLORS.primary)
      .setTitle('💸 withdrawn ✦')
      .setDescription(`moved **${fmt(amount)}** to your wallet`)
      .addFields(
        { name: '👛 wallet', value: `**${fmt(result.wallet)}**`, inline: true },
        { name: '🏦 bank',   value: `**${fmt(result.bank)}**`,   inline: true },
      )
      .setFooter(footer(client));
    const row = buildButtons(
      { id: 'eco_deposit', label: 'deposit back', emoji: '🏦', style: ButtonStyle.Secondary },
      { id: 'eco_gamble',  label: 'gamble',       emoji: '🎰', style: ButtonStyle.Primary },
      { id: 'eco_bal',     label: 'balance',      emoji: '📊', style: ButtonStyle.Secondary },
    );
    return message.reply({ embeds: [embed], components: [row] });
  },
};
