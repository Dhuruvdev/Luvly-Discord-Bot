import { StringSelectMenuBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getHearts, spendHearts, addHearts, addItem, saveUser, getUser } from '../../utils/database.js';

export const SHOP_ITEMS = {
  // ── Aura boosts ────────────────────────────────────────────────────────────
  aura_golden: {
    id: 'aura_golden', emoji: '✨', name: 'golden aura',
    desc: 'sets your aura to **golden** permanently',
    price: 50, category: 'aura',
  },
  aura_ethereal: {
    id: 'aura_ethereal', emoji: '🌸', name: 'ethereal aura',
    desc: 'sets your aura to **ethereal** permanently',
    price: 50, category: 'aura',
  },
  aura_magnetic: {
    id: 'aura_magnetic', emoji: '🔮', name: 'magnetic aura',
    desc: 'sets your aura to **magnetic** permanently',
    price: 50, category: 'aura',
  },
  // ── Chemistry boosts ───────────────────────────────────────────────────────
  chem_boost_sm: {
    id: 'chem_boost_sm', emoji: '⚗️', name: 'chemistry boost (sm)',
    desc: 'adds **+10 chemistry** with your top match',
    price: 20, category: 'boost',
  },
  chem_boost_lg: {
    id: 'chem_boost_lg', emoji: '💞', name: 'chemistry boost (lg)',
    desc: 'adds **+30 chemistry** with a user of your choice',
    price: 50, category: 'boost',
  },
  // ── Collectibles ───────────────────────────────────────────────────────────
  rose: {
    id: 'rose', emoji: '🌹', name: 'red rose',
    desc: 'a collectible rose. send it to someone you admire',
    price: 15, category: 'collectible',
  },
  midnight_letter: {
    id: 'midnight_letter', emoji: '💌', name: 'midnight letter',
    desc: 'an anonymous letter collectible — rare vibe',
    price: 25, category: 'collectible',
  },
  // ── Cooldown resets ────────────────────────────────────────────────────────
  cooldown_skip: {
    id: 'cooldown_skip', emoji: '⚡', name: 'cooldown skip',
    desc: 'skip your daily claim cooldown instantly',
    price: 30, category: 'utility',
  },
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
        return await message.reply({
          embeds: [errorEmbed(`item not found. use **u shop** to see what's available ✦`)],
        });
      }

      const hearts  = getHearts(message.author.id);
      if (hearts < item.price) {
        return await message.reply({
          embeds: [errorEmbed(`not enough hearts. you have **${hearts} 💗** but need **${item.price} 💗** ✦`)],
        });
      }

      // apply item effect
      spendHearts(message.author.id, item.price);

      if (item.category === 'aura') {
        const auraMap = { aura_golden: 'golden', aura_ethereal: 'ethereal', aura_magnetic: 'magnetic' };
        saveUser(message.author.id, { aura: auraMap[item.id] });
      } else if (item.category === 'boost') {
        addItem(message.author.id, item.id, 1);
      } else {
        addItem(message.author.id, item.id, 1);
      }

      const embed = luvEmbed(COLORS.success)
        .setTitle(`${item.emoji} purchased ✦`)
        .setDescription(`you bought **${item.name}** for **${item.price} 💗**\n*${item.desc}*`)
        .addFields({ name: 'hearts remaining', value: `**${getHearts(message.author.id)} 💗**` })
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    // Default: show shop
    const hearts = getHearts(message.author.id);
    const categories = [...new Set(Object.values(SHOP_ITEMS).map(i => i.category))];

    const embed = luvEmbed(COLORS.gold)
      .setTitle(`${EMOJIS.diamond} luvly shop ✦`)
      .setDescription(`you have **${hearts} 💗 hearts**\nuse **u shop buy <item_id>** to purchase ✦\n\n*hearts are earned from daily claims, achievements, and streaks*`)
      .setFooter(footer(client));

    for (const cat of categories) {
      const items = Object.values(SHOP_ITEMS).filter(i => i.category === cat);
      embed.addFields({
        name: `${cat}`,
        value: items.map(i => `${i.emoji} \`${i.id}\` — **${i.name}** · ${i.price} 💗\n  *${i.desc}*`).join('\n'),
        inline: false,
      });
    }

    const select = new StringSelectMenuBuilder()
      .setCustomId('shop_preview')
      .setPlaceholder('preview an item...')
      .addOptions(
        Object.values(SHOP_ITEMS).map(i => ({
          label: i.name,
          description: `${i.price} 💗 — ${i.desc.replace(/\*\*/g, '')}`,
          value: i.id,
          emoji: i.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    await message.reply({ embeds: [embed], components: [row] });
  },
};
