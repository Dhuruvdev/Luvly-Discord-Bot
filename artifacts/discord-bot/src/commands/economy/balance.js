import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { getEcoUser, getNetWorth, fmt, accrueInterest, getEconomy, trendEmoji, inflationLabel } from '../../utils/economy.js';

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
    const u    = getEcoUser(target.id);
    const eco  = getEconomy();
    const net  = getNetWorth(target.id);

    const wallet = u.wallet ?? 0;
    const bank   = u.bank   ?? 0;
    const loan   = u.loan   ?? 0;

    const walletBar = makeBar(wallet, Math.max(wallet + bank, 1000));
    const bankBar   = makeBar(bank,   Math.max(wallet + bank, 1000));

    const loanInfo = loan > 0
      ? `\n⚠️ **loan outstanding:** ${fmt(loan)} @ ${(u.loanRate * 365 * 100).toFixed(1)}% APR`
      : '';

    const embed = luvEmbed(net >= 0 ? COLORS.gold : COLORS.rose)
      .setAuthor({ name: `${target.username}'s luv wallet ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
      .setDescription(
        `${trendEmoji(eco.marketTrend)} market is **${eco.marketTrend}** · ${inflationLabel(eco.inflation)}` +
        loanInfo
      )
      .addFields(
        { name: '👛 wallet',   value: `${fmt(wallet)}\n\`${walletBar}\``,  inline: false },
        { name: '🏦 bank',     value: `${fmt(bank)}\n\`${bankBar}\``,      inline: false },
        { name: '📊 net worth', value: `**${fmt(net)}**`, inline: true },
        { name: `${loan > 0 ? '🔴' : '✅'} debt`, value: loan > 0 ? `**${fmt(loan)}**` : 'none', inline: true },
        { name: '💹 savings rate', value: `${(eco.savingsRate * 100).toFixed(2)}%/day`, inline: true },
      )
      .setFooter(footer(client));

    const rows = [];
    if (isSelf) {
      rows.push(buildButtons(
        { id: 'eco_work',     label: 'work',        emoji: '💼', style: ButtonStyle.Primary },
        { id: 'eco_deposit',  label: 'deposit all', emoji: '🏦', style: ButtonStyle.Secondary },
        { id: 'daily_claim',  label: 'daily',       emoji: '🎁', style: ButtonStyle.Success },
      ));
    } else {
      rows.push(buildButtons(
        { id: 'eco_market',   label: 'market',      emoji: '📊', style: ButtonStyle.Secondary },
        { id: 'daily_claim',  label: 'daily',       emoji: '🎁', style: ButtonStyle.Primary },
      ));
    }

    await message.reply({ embeds: [embed], components: rows });
  },
};

function makeBar(val, max, len = 15) {
  const filled = Math.max(0, Math.min(len, Math.round((val / max) * len)));
  return '█'.repeat(filled) + '░'.repeat(len - filled);
}
