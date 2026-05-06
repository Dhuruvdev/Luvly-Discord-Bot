import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult, getEcoUser } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';
import { getTable, markDirty } from '../../utils/store.js';

const R         = '<:right:1501255316350959858>';
const CV2       = MessageFlags.IsComponentsV2;
const COOLDOWN_MS = 45 * 60 * 1_000;

const FISH_TABLE = [
  { w: 35, name: 'a soggy boot',         emoji: '', min: 0,   max: 2   },
  { w: 25, name: 'a tiny goldfish',       emoji: '', min: 8,   max: 20  },
  { w: 18, name: 'a plump bass',          emoji: '', min: 25,  max: 50  },
  { w: 10, name: 'a glowing jellyfish',   emoji: '', min: 55,  max: 100 },
  { w:  6, name: 'a moonlit swordfish',   emoji: '', min: 100, max: 180 },
  { w:  4, name: 'a midnight kraken arm', emoji: '', min: 200, max: 400 },
  { w:  2, name: 'THE LOVE WHALE',        emoji: '', min: 500, max: 999 },
];

function pickFish() {
  const total = FISH_TABLE.reduce((s, f) => s + f.w, 0);
  let roll    = Math.random() * total;
  for (const f of FISH_TABLE) { roll -= f.w; if (roll <= 0) return f; }
  return FISH_TABLE[0];
}

export default {
  name: 'fish',
  aliases: ['fishing', 'cast'],
  description: 'fish for luv (45m cooldown)',
  category: 'economy',
  usage: 'fish',
  cooldown: 0,

  async execute(message, args, client) {
    const userId = message.author.id;
    const u      = getEcoUser(userId);
    const now    = Date.now();
    const waited = now - (u.lastFish ?? 0);

    if (waited < COOLDOWN_MS) {
      const leftM = Math.ceil((COOLDOWN_MS - waited) / 60_000);
      const text  =
        `**﹕ⵌ┆  Fishing Cooldown ꩜ .**\n\n` +
        `the fish aren't biting yet.\n\n` +
        `>  try again in **${leftM} min**`;
      const row = buildButtons(
        { id: 'eco_work', label: 'work instead', emoji: '', style: ButtonStyle.Secondary },
        { id: 'eco_hunt', label: 'hunt instead', emoji: '', style: ButtonStyle.Secondary },
        { id: 'eco_bal',  label: 'balance',      emoji: '', style: ButtonStyle.Primary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    tickMarket();
    const eco    = getEconomy();
    const fish   = pickFish();
    const mult   = yieldMult();
    const base   = fish.min + Math.floor(Math.random() * Math.max(1, fish.max - fish.min));
    const earned = Math.max(0, Math.floor(base * mult));

    if (earned > 0) addToWallet(userId, earned);
    const t = getTable('economy');
    if (t[userId]) { t[userId].lastFish = now; markDirty('economy'); }
    addXP(userId, 4);

    const isBig  = fish.w <= 4;
    const isBoot = fish.name.includes('boot');

    const catchLine = isBoot
      ? `> *a wet boot. classic. you've earned the experience.*`
      : isBig
        ? `>  *what a legendary catch — the stars aligned for you tonight*`
        : `> *the water was calm and the catch was ${earned > 100 ? 'generous' : 'decent'} ✦*`;

    const text =
      `**﹕ⵌ┆ ${fish.emoji} You Caught ${fish.name}${isBig ? ' ' : ''} ꩜ .**\n\n` +
      `${catchLine}\n\n` +
      `${R} **Result:**\n` +
      `> ⤿   Earned: ${earned > 0 ? `**${fmt(earned)}**` : '*nothing *'}\n` +
      `> ⤿   Wallet: **${fmt(getWallet(userId))}**\n` +
      `> ⤿   Market: ${eco.marketTrend}`;

    const row = buildButtons(
      { id: 'eco_fish',    label: 'fish again', emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_deposit', label: 'bank it',    emoji: '', style: ButtonStyle.Secondary },
      { id: 'eco_bal',     label: 'balance',    emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
