import { ButtonStyle } from 'discord.js';
import { COLORS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import {
  getEconomy, tickInflation, tickMarket,
  fmt, trendEmoji, inflationLabel,
} from '../../utils/economy.js';
import { getTable } from '../../utils/store.js';

export default {
  name: 'market',
  aliases: ['eco', 'economy', 'inflation', 'rates'],
  description: 'live economy dashboard — inflation, market, rates',
  category: 'economy',
  usage: 'market',
  cooldown: 10_000,

  async execute(message, args, client) {
    tickInflation();
    tickMarket();

    const eco   = getEconomy();
    const t     = getTable('economy');

    // Total users in economy
    const userCount = Object.keys(t).filter(k => k !== '__global').length;
    const totalWallet = Object.values(t).filter(v => v && typeof v === 'object' && 'wallet' in v)
      .reduce((s, u) => s + (u.wallet ?? 0), 0);
    const totalBank = Object.values(t).filter(v => v && typeof v === 'object' && 'bank' in v)
      .reduce((s, u) => s + (u.bank ?? 0), 0);
    const totalDebt = Object.values(t).filter(v => v && typeof v === 'object' && 'loan' in v)
      .reduce((s, u) => s + (u.loan ?? 0), 0);

    const inf      = eco.inflation;
    const infLabel = inflationLabel(inf);
    const trend    = eco.marketTrend;
    const mood     = eco.marketMood;

    // Forecast
    const inflationDir = inf > 1.05 ? '📈 rising' : inf < 0.98 ? '📉 falling' : '➡️ stable';
    const marketForecast = mood > 1.10 ? '☀️ bullish outlook' : mood < 0.85 ? '🌧️ bearish outlook' : '🌤️ mixed signals';

    // Inflation bar
    const infPct   = Math.min(100, Math.round(((inf - 0.8) / 1.7) * 100));
    const infBar   = '█'.repeat(Math.round(infPct / 5)) + '░'.repeat(20 - Math.round(infPct / 5));

    const embed = luvEmbed(trend === 'bull' ? COLORS.success : trend === 'bear' ? COLORS.rose : COLORS.primary)
      .setTitle('📊 luvly economy dashboard ✦')
      .setDescription(
        `**${trendEmoji(trend)} ${trend.toUpperCase()} MARKET** — *${marketForecast}*\n` +
        `${infLabel}\n\n` +
        `\`${infBar}\`  ×${inf.toFixed(4)}`
      )
      .addFields(
        { name: '📈 inflation',      value: `×${inf.toFixed(4)} (${inflationDir})`,        inline: true },
        { name: '🏦 savings rate',   value: `${(eco.savingsRate * 100).toFixed(2)}%/day`,  inline: true },
        { name: '💳 loan APR',       value: `${(eco.baseInterestRate * 100).toFixed(2)}%`, inline: true },
        { name: '🎮 market mood',    value: `×${mood.toFixed(3)} yields`,                  inline: true },
        { name: '👥 participants',   value: `**${userCount}** users`,                      inline: true },
        { name: '💸 total in wallets', value: fmt(totalWallet),                            inline: true },
        { name: '🏦 total in banks', value: fmt(totalBank),                                inline: true },
        { name: '🔴 total debt',     value: fmt(totalDebt),                                inline: true },
        { name: '🪙 total supply',   value: fmt(totalWallet + totalBank),                  inline: true },
        {
          name: '💡 market insight',
          value: trend === 'bull'
            ? '> 📈 *hunt & fish yield more — great time to earn*'
            : trend === 'bear'
              ? '> 📉 *yields are low — consider saving and repaying loans*'
              : '> 📊 *stable conditions — balanced strategy recommended*',
        },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '👛', style: ButtonStyle.Primary },
      { id: 'eco_hunt', label: 'hunt',       emoji: '🏹', style: ButtonStyle.Secondary },
      { id: 'eco_fish', label: 'fish',       emoji: '🎣', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
