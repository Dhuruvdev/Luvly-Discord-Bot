import { AttachmentBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getUser, getUserTheme, setUserTheme, buyTheme, getOwnedThemes, getHearts } from '../../utils/database.js';
import { generateCard } from '../../utils/cardGenerator.js';
import { THEME_LIST, getTheme, RARITY_COLORS } from '../../themes/index.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
function rarityBadge(r) {
  const map = { common: '⬜ Common', rare: '🟦 Rare', legendary: '🟨 Legendary' };
  return map[r] ?? r;
}

function formatThemeList(owned) {
  return THEME_LIST.map(t => {
    const isOwned = owned.includes(t.id);
    const mark    = isOwned ? '✅' : (t.cost === 0 ? '🆓' : `💗 ${t.cost}`);
    return `${t.emoji} **${t.name}** \`${t.id}\` — ${rarityBadge(t.rarity)} — ${mark}`;
  }).join('\n');
}

// ── Sub-command handlers ──────────────────────────────────────────────────────
async function handleList(message, client) {
  const user  = getUser(message.author.id);
  const owned = getOwnedThemes(message.author.id);

  const embed = luvEmbed(COLORS.primary)
    .setTitle(`${EMOJIS.sparkle} luvly card themes`)
    .setDescription(formatThemeList(owned))
    .addFields({ name: '💗 your hearts', value: `\`${getHearts(message.author.id)}\``, inline: true },
               { name: `${EMOJIS.sparkle} current theme`, value: `\`${user.theme ?? 'lavender'}\``, inline: true })
    .setFooter(footer(client));

  await message.reply({ embeds: [embed] });
}

async function handleSet(message, args, client) {
  const id    = args[1]?.toLowerCase();
  const theme = getTheme(id);

  if (!id || theme.id === 'lavender' && id !== 'lavender' && !THEME_LIST.find(t => t.id === id)) {
    return message.reply({ embeds: [errorEmbed('unknown theme id. use `u theme list` to see all themes ✦')] });
  }

  const owned = getOwnedThemes(message.author.id);
  if (!owned.includes(theme.id)) {
    return message.reply({
      embeds: [errorEmbed(`you don't own **${theme.name}** yet! buy it with \`u theme buy ${theme.id}\` ✦`)]
    });
  }

  setUserTheme(message.author.id, theme.id);

  const embed = luvEmbed(COLORS.success)
    .setDescription(`${EMOJIS.sparkle} theme set to ${theme.emoji} **${theme.name}**! view it with \`u card\``)
    .setFooter(footer(client));

  await message.reply({ embeds: [embed] });
}

async function handleBuy(message, args, client) {
  const id    = args[1]?.toLowerCase();
  const theme = THEME_LIST.find(t => t.id === id);

  if (!theme) {
    return message.reply({ embeds: [errorEmbed('unknown theme id. use `u theme list` to see all themes ✦')] });
  }
  if (theme.cost === 0) {
    return message.reply({ embeds: [errorEmbed(`**${theme.name}** is free — use \`u theme set ${theme.id}\` to equip it ✦`)] });
  }

  const owned = getOwnedThemes(message.author.id);
  if (owned.includes(theme.id)) {
    return message.reply({ embeds: [errorEmbed(`you already own **${theme.name}** ✦`)] });
  }

  const result = buyTheme(message.author.id, theme.id, theme.cost);
  if (!result.success) {
    return message.reply({
      embeds: [errorEmbed(`not enough hearts! you need **${theme.cost}** 💗 but only have **${result.balance}** ✦`)]
    });
  }

  const embed = luvEmbed(COLORS.success)
    .setDescription(`${EMOJIS.sparkle} purchased ${theme.emoji} **${theme.name}**! (-${theme.cost} 💗)\nuse \`u theme set ${theme.id}\` to equip it ✦`)
    .setFooter(footer(client));

  await message.reply({ embeds: [embed] });
}

async function handlePreview(message, args, client) {
  const id    = args[1]?.toLowerCase() ?? 'lavender';
  const theme = THEME_LIST.find(t => t.id === id);
  if (!theme) {
    return message.reply({ embeds: [errorEmbed('unknown theme id. use `u theme list` to see all themes ✦')] });
  }

  await message.channel.sendTyping().catch(() => {});

  const loadMsg = await message.reply({
    embeds: [luvEmbed(COLORS.primary).setDescription(`${EMOJIS.sparkle} previewing **${theme.name}** theme...`)]
  });

  try {
    const user   = getUser(message.author.id);
    const hearts = getHearts(message.author.id);
    const buffer = await generateCard({
      username:  message.author.username,
      avatarURL: message.author.displayAvatarURL({ extension: 'png', size: 256 }),
      pronouns:  user.pronouns,
      bio:       user.bio,
      interests: user.interests ?? [],
      xp:        user.xp       ?? 0,
      streak:    user.streak    ?? 0,
      hearts,
      aura:      user.aura      ?? 'soft',
    }, theme.id);

    const attachment = new AttachmentBuilder(buffer, { name: `preview-${theme.id}.png` });
    const owned      = getOwnedThemes(message.author.id);

    const embed = luvEmbed(COLORS.primary)
      .setTitle(`${theme.emoji} ${theme.name} preview`)
      .setDescription(`*${theme.description}*\n${rarityBadge(theme.rarity)} · ${theme.cost === 0 ? 'free' : `💗 ${theme.cost} hearts`}`)
      .setImage(`attachment://preview-${theme.id}.png`)
      .setFooter(footer(client));

    const buttons = [];
    if (!owned.includes(theme.id) && theme.cost > 0) {
      buttons.push({ id: `theme_buy_${theme.id}`, label: `buy (${theme.cost} 💗)`, style: ButtonStyle.Success });
    }
    if (owned.includes(theme.id)) {
      buttons.push({ id: `theme_set_${theme.id}`, label: 'equip this theme', style: ButtonStyle.Primary });
    }

    const components = buttons.length ? [buildButtons(...buttons.map(b => ({ ...b, emoji: theme.emoji })))] : [];
    await loadMsg.edit({ embeds: [embed], files: [attachment], components });
  } catch (err) {
    console.error('[THEME PREVIEW]', err);
    await loadMsg.edit({ embeds: [errorEmbed('preview failed ✦')], components: [] });
  }
}

async function handleInfo(message, args, client) {
  const user  = getUser(message.author.id);
  const owned = getOwnedThemes(message.author.id);
  const curr  = getTheme(user.theme ?? 'lavender');

  const embed = luvEmbed(COLORS.primary)
    .setTitle(`${EMOJIS.sparkle} your theme`)
    .setDescription(`current: ${curr.emoji} **${curr.name}**\n*${curr.description}*`)
    .addFields(
      { name: 'owned themes', value: owned.map(id => getTheme(id).emoji + ' `' + id + '`').join('  ') || 'none', inline: false },
      { name: '💗 hearts',   value: `\`${getHearts(message.author.id)}\``, inline: true },
    )
    .setFooter(footer(client));

  const row = buildButtons(
    { id: 'theme_list', label: 'browse themes', emoji: '🎨', style: ButtonStyle.Primary },
  );
  await message.reply({ embeds: [embed], components: [row] });
}

// ── Main export ───────────────────────────────────────────────────────────────
export default {
  name: 'theme',
  aliases: ['themes'],
  description: 'manage your profile card theme',
  category: 'social',
  usage: 'theme [list | set <id> | buy <id> | preview <id>]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();
    switch (sub) {
      case 'list':    return handleList(message, client);
      case 'set':     return handleSet(message, args, client);
      case 'buy':     return handleBuy(message, args, client);
      case 'preview': return handlePreview(message, args, client);
      default:        return handleInfo(message, args, client);
    }
  },
};
