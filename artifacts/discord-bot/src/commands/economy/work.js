import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

const JOBS = [
  { title: 'barista',          emoji: '', flavor: 'made 47 lattes and smiled through it all' },
  { title: 'graphic designer', emoji: '', flavor: 'delivered a 300-slide deck at 3am' },
  { title: 'streamer',         emoji: '', flavor: 'went live for 4 hours, peaked at 3 viewers' },
  { title: 'poet',             emoji: '', flavor: 'sold one poem for exactly enough' },
  { title: 'photographer',     emoji: '', flavor: 'captured golden hour and nearly cried' },
  { title: 'DJ',               emoji: '', flavor: 'dropped a set at a rooftop party' },
  { title: 'cat sitter',       emoji: '', flavor: 'watched 4 cats judge you silently' },
  { title: 'tarot reader',     emoji: '', flavor: 'gave 6 readings and predicted everything correctly' },
  { title: 'street artist',    emoji: '', flavor: 'tagged something beautiful on an abandoned wall' },
  { title: 'florist',          emoji: '', flavor: 'arranged 30 bouquets while thinking of someone' },
  { title: 'writer',           emoji: '', flavor: 'sent the manuscript. it was perfect.' },
  { title: 'therapist',        emoji: '', flavor: 'listened more than you spoke today' },
];

const COOLDOWN_MS = 30 * 60 * 1_000;

export default {
  name: 'work',
  aliases: ['wrk', 'job'],
  description: 'work a shift and earn luv (30m cooldown)',
  category: 'economy',
  usage: 'work',
  cooldown: 0,

  async execute(message, args, client) {
    const userId = message.author.id;
    const { getEcoUser } = await import('../../utils/economy.js');
    const u      = getEcoUser(userId);
    const now    = Date.now();
    const waited = now - (u.lastWork ?? 0);

    if (waited < COOLDOWN_MS) {
      const leftM = Math.ceil((COOLDOWN_MS - waited) / 60_000);
      const text  =
        `**﹕ⵌ┆  Still On Shift ꩜ .**\n\n` +
        `you're still recovering from your last shift.\n\n` +
        `>  back in **${leftM} min**`;
      const row = buildButtons(
        { id: 'eco_hunt', label: 'hunt instead', emoji: '', style: ButtonStyle.Secondary },
        { id: 'eco_fish', label: 'fish instead', emoji: '', style: ButtonStyle.Secondary },
        { id: 'eco_bal',  label: 'my balance',   emoji: '', style: ButtonStyle.Primary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    tickMarket();
    const eco   = getEconomy();
    const job   = JOBS[Math.floor(Math.random() * JOBS.length)];
    const mult  = yieldMult();
    const base  = 20 + Math.floor(Math.random() * 40);
    const earned = Math.max(10, Math.floor(base * mult * eco.inflation));

    addToWallet(userId, earned);

    const { getTable, markDirty } = await import('../../utils/store.js');
    const t = getTable('economy');
    if (t[userId]) { t[userId].lastWork = now; markDirty('economy'); }

    addXP(userId, 3);

    const trendNote = eco.marketTrend === 'bull'
      ? '\n>  *bull market — wages are up today*'
      : eco.marketTrend === 'bear'
        ? '\n>  *bear market — times are tough*'
        : '';

    const text =
      `**﹕ⵌ┆ ${job.emoji} Shift Complete ꩜ .**\n\n` +
      `you worked as a **${job.title}**\n` +
      `> *${job.flavor}*${trendNote}\n\n` +
      `${R} **Earnings:**\n` +
      `> ⤿   Earned: **${fmt(earned)}**\n` +
      `> ⤿   Wallet: **${fmt(getWallet(userId))}**\n` +
      `> ⤿   Market: ${eco.marketTrend} (×${mult.toFixed(2)})`;

    const row = buildButtons(
      { id: 'eco_deposit', label: 'bank it',  emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_hunt',    label: 'hunt',     emoji: '', style: ButtonStyle.Secondary },
      { id: 'eco_bal',     label: 'balance',  emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
