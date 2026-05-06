import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult, getEcoUser } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';
import { getTable, markDirty } from '../../utils/store.js';

const R         = '<:right:1501255316350959858>';
const CV2       = MessageFlags.IsComponentsV2;
const COOLDOWN_MS = 60 * 60 * 1_000;

const LOOT_TABLE = [
  { w: 30, label: 'a stray kitten begging for food', emoji: '🐱', min: 5,   max: 15  },
  { w: 25, label: 'a wild rabbit',                   emoji: '🐇', min: 15,  max: 35  },
  { w: 20, label: 'a rare fox',                      emoji: '🦊', min: 40,  max: 80  },
  { w: 12, label: 'a majestic deer',                 emoji: '🦌', min: 70,  max: 130 },
  { w:  7, label: 'a golden eagle',                  emoji: '🦅', min: 120, max: 200 },
  { w:  4, label: 'a legendary dragon butterfly',    emoji: '🦋', min: 200, max: 350 },
  { w:  2, label: 'THE VOID RABBIT',                 emoji: '🐰', min: 400, max: 800 },
];

function pickLoot() {
  const total = LOOT_TABLE.reduce((s, l) => s + l.w, 0);
  let roll    = Math.random() * total;
  for (const loot of LOOT_TABLE) { roll -= loot.w; if (roll <= 0) return loot; }
  return LOOT_TABLE[0];
}

export default {
  name: 'hunt',
  aliases: ['hnt', 'owo hunt', 'h'],
  description: 'hunt for luv and loot (1hr cooldown)',
  category: 'economy',
  usage: 'hunt',
  cooldown: 0,

  async execute(message, args, client) {
    const userId = message.author.id;
    const u      = getEcoUser(userId);
    const now    = Date.now();
    const waited = now - (u.lastHunt ?? 0);

    if (waited < COOLDOWN_MS) {
      const leftM = Math.ceil((COOLDOWN_MS - waited) / 60_000);
      const text  =
        `**﹕ⵌ┆ 🏹 Hunting Cooldown ꩜ .**\n\n` +
        `your arrows are recharging.\n\n` +
        `> ⏳ ready in **${leftM} min**`;
      const row = buildButtons(
        { id: 'eco_work', label: 'work instead', emoji: '💼', style: ButtonStyle.Secondary },
        { id: 'eco_fish', label: 'fish instead', emoji: '🎣', style: ButtonStyle.Secondary },
        { id: 'eco_bal',  label: 'balance',      emoji: '👛', style: ButtonStyle.Primary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    tickMarket();
    const eco    = getEconomy();
    const loot   = pickLoot();
    const mult   = yieldMult();
    const base   = loot.min + Math.floor(Math.random() * (loot.max - loot.min));
    const earned = Math.max(1, Math.floor(base * mult));

    addToWallet(userId, earned);
    const t = getTable('economy');
    if (t[userId]) { t[userId].lastHunt = now; markDirty('economy'); }
    addXP(userId, 5);

    const isRare   = loot.w <= 4;
    const trendStr = eco.marketTrend === 'bull'
      ? '📈 bull market bonus!'
      : eco.marketTrend === 'bear'
        ? '📉 bear market dampener'
        : '📊 stable market';

    const text =
      `**﹕ⵌ┆ ${loot.emoji} Hunt Complete ꩜ .**${isRare ? ' 🌟 RARE FIND!' : ''}\n\n` +
      `you found **${loot.label}**${isRare ? '\n> ✨ *what a catch!*' : ''}\n\n` +
      `<:right:1501255316350959858> **Loot:**\n` +
      `> ⤿  💰 Earned: **${fmt(earned)}**\n` +
      `> ⤿  👛 Wallet: **${fmt(getWallet(userId))}**\n` +
      `> ⤿  📊 Market: ${trendStr}`;

    const row = buildButtons(
      { id: 'eco_hunt',    label: 'hunt again', emoji: '🏹', style: ButtonStyle.Primary },
      { id: 'eco_deposit', label: 'bank it',    emoji: '🏦', style: ButtonStyle.Secondary },
      { id: 'eco_bal',     label: 'balance',    emoji: '👛', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
