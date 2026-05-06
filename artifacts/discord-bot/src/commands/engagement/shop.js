import { StringSelectMenuBuilder, ActionRowBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getHearts, spendHearts, addItem, saveUser } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export const SHOP_ITEMS = {
  aura_golden:     { id: 'aura_golden',     emoji: '', name: 'golden aura',          desc: 'sets your aura to **golden** permanently',          price: 50, category: 'aura' },
  aura_ethereal:   { id: 'aura_ethereal',   emoji: '', name: 'ethereal aura',         desc: 'sets your aura to **ethereal** permanently',        price: 50, category: 'aura' },
  aura_magnetic:   { id: 'aura_magnetic',   emoji: '', name: 'magnetic aura',         desc: 'sets your aura to **magnetic** permanently',        price: 50, category: 'aura' },
  chem_boost_sm:   { id: 'chem_boost_sm',   emoji: '', name: 'chemistry boost (sm)',  desc: 'adds **+10 chemistry** with your top match',        price: 20, category: 'boost' },
  chem_boost_lg:   { id: 'chem_boost_lg',   emoji: '', name: 'chemistry boost (lg)',  desc: 'adds **+30 chemistry** with a user of your choice', price: 50, category: 'boost' },
  rose:            { id: 'rose',            emoji: '', name: 'red rose',              desc: 'a collectible rose. send it to someone you admire', price: 15, category: 'collectible' },
  midnight_letter: { id: 'midnight_letter', emoji: '', name: 'midnight letter',       desc: 'an anonymous letter collectible — rare vibe',       price: 25, category: 'collectible' },
  cooldown_skip:   { id: 'cooldown_skip',   emoji: '', name: 'cooldown skip',          desc: 'skip your daily claim cooldown instantly',          price: 30, category: 'utility' },
};

export default {
  name: 'shop',
  aliases: ['store', 'buy', 'inv', 'inventory'],
  description: 'spend hearts on auras, boosts, and collectibles',
  category: 'engagement',
  usage: 'shop [buy <item>]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    if (sub === 'buy') {
      const itemId = args[1]?.toLowerCase();
      const item   = SHOP_ITEMS[itemId];
      if (!item) {
        return await message.reply({ flags: CV2, components: [luvContainer("item not found. use **u shop** to see what's available ✦")] });
      }

      const hearts = getHearts(message.author.id);
      if (hearts < item.price) {
        return await message.reply({ flags: CV2, components: [luvContainer(`>  not enough hearts. you have **${hearts} ** but need **${item.price} ** ✦`)] });
      }

      spendHearts(message.author.id, item.price);

      if (item.category === 'aura') {
        const auraMap = { aura_golden: 'golden', aura_ethereal: 'ethereal', aura_magnetic: 'magnetic' };
        saveUser(message.author.id, { aura: auraMap[item.id] });
      } else {
        addItem(message.author.id, item.id, 1);
      }

      const text =
        `**﹕ⵌ┆ ${item.emoji} Purchased ꩜ .**\n\n` +
        `you bought **${item.name}** for **${item.price} **\n` +
        `> *${item.desc.replace(/\*\*/g, '')}*\n\n` +
        `${R} **Hearts Remaining:** **${getHearts(message.author.id)} **`;
      const buyRow = buildButtons(
        { id: 'shop_open',   label: 'shop more',   emoji: '', style: ButtonStyle.Secondary },
        { id: 'daily_claim', label: 'earn hearts', emoji: '', style: ButtonStyle.Primary },
      );
      return await message.reply({ flags: CV2, components: [luvContainer(text, buyRow)] });
    }

    const hearts     = getHearts(message.author.id);
    const categories = [...new Set(Object.values(SHOP_ITEMS).map(i => i.category))];

    let shopText =
      `**﹕ⵌ┆ ${EMOJIS.diamond} Luvly Shop ꩜ .**\n\n` +
      `you have **${hearts}  hearts**\n` +
      `> *hearts are earned from daily claims, achievements & streaks*\n\n` +
      `use **u shop buy <item_id>** to purchase\n`;

    for (const cat of categories) {
      const items = Object.values(SHOP_ITEMS).filter(i => i.category === cat);
      shopText += `\n${R} **${cat.charAt(0).toUpperCase() + cat.slice(1)}:**\n`;
      for (const it of items) {
        shopText += `> ⤿  ${it.emoji} \`${it.id}\` — **${it.name}** · ${it.price} \n`;
      }
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('shop_preview')
      .setPlaceholder('preview an item...')
      .addOptions(
        Object.values(SHOP_ITEMS).map(i => ({
          label:       i.name,
          description: `${i.price}  — ${i.desc.replace(/\*\*/g, '').slice(0, 50)}`,
          value:       i.id,
          emoji:       i.emoji,
        }))
      );

    const selectRow = new ActionRowBuilder().addComponents(select);
    await message.reply({ flags: CV2, components: [luvContainer(shopText, selectRow)] });
  },
};
