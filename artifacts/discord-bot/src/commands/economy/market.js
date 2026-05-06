import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import {
  getEconomy, tickInflation, tickMarket,
  fmt, trendEmoji, inflationLabel,
} from '../../utils/economy.js';
import { getTable } from '../../utils/store.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

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

    const eco = getEconomy();
    const t   = getTable('economy');

    const userCount   = Object.keys(t).filter(k => k !== '__global').length;
    const totalWallet = Object.values(t).filter(v => v && typeof v === 'object' && 'wallet' in v).reduce((s, u) => s + (u.wallet ?? 0), 0);
    const totalBank   = Object.values(t).filter(v => v && typeof v === 'object' && 'bank' in v).reduce((s, u) => s + (u.bank ?? 0), 0);
    const totalDebt   = Object.values(t).filter(v => v && typeof v === 'object' && 'loan' in v).reduce((s, u) => s + (u.loan ?? 0), 0);

    const inf      = eco.inflation;
    const trend    = eco.marketTrend;
    const mood     = eco.marketMood;

    const inflationDir   = inf > 1.05 ? ' rising' : inf < 0.98 ? ' falling' : ' stable';
    const marketForecast = mood > 1.10 ? ' bullish outlook' : mood < 0.85 ? ' bearish outlook' : ' mixed signals';

    const infPct = Math.min(100, Math.round(((inf - 0.8) / 1.7) * 100));
    const infBar = '█'.repeat(Math.round(infPct / 5)) + '░'.repeat(20 - Math.round(infPct / 5));

    const insight = trend === 'bull'
      ? '>  *hunt & fish yield more — great time to earn*'
      : trend === 'bear'
        ? '>  *yields are low — consider saving and repaying loans*'
        : '>  *stable conditions — balanced strategy recommended*';

    const text =
      `**﹕ⵌ┆  Luvly Economy Dashboard ꩜ .**\n\n` +
      `**${trendEmoji(trend)} ${trend.toUpperCase()} MARKET** — *${marketForecast}*\n` +
      `${inflationLabel(inf)}\n\`${infBar}\`  ×${inf.toFixed(4)}\n\n` +
      `${R} **Market Rates:**\n` +
      `> ⤿   Inflation: ×${inf.toFixed(4)} (${inflationDir})\n` +
      `> ⤿   Savings Rate: ${(eco.savingsRate * 100).toFixed(2)}%/day\n` +
      `> ⤿   Loan APR: ${(eco.baseInterestRate * 100).toFixed(2)}%\n` +
      `> ⤿   Market Mood: ×${mood.toFixed(3)} yields\n\n` +
      `${R} **Economy Stats:**\n` +
      `> ⤿   Participants: **${userCount}** users\n` +
      `> ⤿   Total in Wallets: ${fmt(totalWallet)}\n` +
      `> ⤿   Total in Banks: ${fmt(totalBank)}\n` +
      `> ⤿   Total Debt: ${fmt(totalDebt)}\n` +
      `> ⤿   Total Supply: ${fmt(totalWallet + totalBank)}\n\n` +
      `${R} **Market Insight:**\n${insight}`;

    const row = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_hunt', label: 'hunt',       emoji: '', style: ButtonStyle.Secondary },
      { id: 'eco_fish', label: 'fish',       emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
