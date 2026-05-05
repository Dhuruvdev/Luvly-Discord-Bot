import { ButtonStyle } from 'discord.js';
import { COLORS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult, getEcoUser } from '../../utils/economy.js';
import { addXP, addItem } from '../../utils/database.js';
import { getTable, markDirty } from '../../utils/store.js';

const COOLDOWN_MS = 60 * 60 * 1_000; // 1hr

const LOOT_TABLE = [
  // [weight, type, label, emoji, luv_min, luv_max, itemId?]
  { w: 30, label: 'a stray kitten begging for food', emoji: '🐱', min: 5,   max: 15  },
  { w: 25, label: 'a wild rabbit',                   emoji: '🐇', min: 15,  max: 35  },
  { w: 20, label: 'a rare fox',                       emoji: '🦊', min: 40,  max: 80  },
  { w: 12, label: 'a majestic deer',                  emoji: '🦌', min: 70,  max: 130 },
  { w:  7, label: 'a golden eagle',                   emoji: '🦅', min: 120, max: 200 },
  { w:  4, label: 'a legendary dragon butterfly',     emoji: '🦋', min: 200, max: 350 },
  { w:  2, label: 'THE VOID RABBIT',                  emoji: '🐰', min: 400, max: 800 },
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
    const userId  = message.author.id;
    const u       = getEcoUser(userId);
    const now     = Date.now();
    const waited  = now - (u.lastHunt ?? 0);

    if (waited < COOLDOWN_MS) {
      const left  = COOLDOWN_MS - waited;
      const leftM = Math.ceil(left / 60_000);
      const embed = luvEmbed(COLORS.neutral)
        .setTitle('🏹 hunting cooldown ✦')
        .setDescription(`your arrows are recharging.\n\n⏳ ready in **${leftM} min**`)
        .setFooter(footer(client));
      const row = buildButtons(
        { id: 'eco_work', label: 'work instead', emoji: '💼', style: ButtonStyle.Secondary },
        { id: 'eco_fish', label: 'fish instead', emoji: '🎣', style: ButtonStyle.Secondary },
        { id: 'eco_bal',  label: 'balance',      emoji: '👛', style: ButtonStyle.Primary },
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    tickMarket();
    const eco   = getEconomy();
    const loot  = pickLoot();
    const mult  = yieldMult();
    const base  = loot.min + Math.floor(Math.random() * (loot.max - loot.min));
    const earned = Math.max(1, Math.floor(base * mult));

    addToWallet(userId, earned);
    const t = getTable('economy');
    if (t[userId]) { t[userId].lastHunt = now; markDirty('economy'); }

    addXP(userId, 5);

    const isRare   = loot.w <= 4;
    const color    = isRare ? COLORS.gold : loot.w <= 12 ? COLORS.purple : COLORS.primary;
    const trendStr = eco.marketTrend === 'bull' ? '📈 bull market bonus!' : eco.marketTrend === 'bear' ? '📉 bear market dampener' : '📊 stable market';

    const embed = luvEmbed(color)
      .setTitle(`${loot.emoji} hunt complete ✦${isRare ? ' 🌟 RARE FIND!' : ''}`)
      .setDescription(`you found **${loot.label}**${isRare ? '\n> ✨ *what a catch!*' : ''}`)
      .addFields(
        { name: '💰 earned',  value: `**${fmt(earned)}**`,             inline: true },
        { name: '👛 wallet',  value: `**${fmt(getWallet(userId))}**`,  inline: true },
        { name: '📊 market',  value: trendStr,                         inline: true },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'eco_hunt',    label: 'hunt again',  emoji: '🏹', style: ButtonStyle.Primary },
      { id: 'eco_deposit', label: 'bank it',     emoji: '🏦', style: ButtonStyle.Secondary },
      { id: 'eco_bal',     label: 'balance',     emoji: '👛', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
