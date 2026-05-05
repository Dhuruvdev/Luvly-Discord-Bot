import { AttachmentBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getUser, getUserTheme, setUserTheme, buyTheme, getOwnedThemes, getHearts } from '../../utils/database.js';
import { generateCard } from '../../utils/cardGenerator.js';
import { THEME_LIST, getTheme, RARITY_COLORS } from '../../themes/index.js';

function rarityBadge(r) {
  const map = { common: '⬜ Common', rare: '🟦 Rare', legendary: '🟨 Legendary' };
  return map[r] ?? r;
}

async function handleList(message, client) {
  const { buildThemeListPage } = await import('../../utils/themeListPage.js');
  const loading = await message.reply({
    embeds: [luvEmbed(COLORS.primary).setDescription(`${EMOJIS.sparkle} loading theme gallery...`)],
  });
  try {
    const page = await buildThemeListPage(message.author.id, 0, client, message.author);
    await loading.edit({ embeds: [page.embed], files: page.files, components: page.components });
  } catch (err) {
    console.error('[THEME LIST]', err);
    await loading.edit({ embeds: [errorEmbed('failed to load themes ✦')], components: [] });
  }
}

async function handleSet(message, args, client) {
  const id    = args[1]?.toLowerCase();
  const theme = THEME_LIST.find(t => t.id === id);
  const homeRow = buildButtons(
    { id: 'theme_list', label: 'browse themes', emoji: '🎨', style: ButtonStyle.Secondary },
    { id: 'daily_card', label: 'view my card',  emoji: '🎴', style: ButtonStyle.Primary },
  );
  if (!id || !theme) {
    return message.reply({ embeds: [errorEmbed('unknown theme id. use `u theme list` to browse ✦')], components: [homeRow] });
  }
  const owned = getOwnedThemes(message.author.id);
  if (!owned.includes(theme.id)) {
    return message.reply({
      embeds: [errorEmbed(`you don't own **${theme.name}** yet! buy it with \`u theme buy ${theme.id}\` ✦`)],
      components: [homeRow],
    });
  }
  setUserTheme(message.author.id, theme.id);
  const embed = luvEmbed(COLORS.success)
    .setDescription(`${EMOJIS.sparkle} theme set to ${theme.emoji} **${theme.name}**! view it with \`u card\``)
    .setFooter(footer(client));
  await message.reply({ embeds: [embed], components: [homeRow] });
}

async function handleBuy(message, args, client) {
  const id    = args[1]?.toLowerCase();
  const theme = THEME_LIST.find(t => t.id === id);
  const browseRow = buildButtons(
    { id: 'theme_list', label: 'browse themes', emoji: '🎨', style: ButtonStyle.Secondary },
    { id: 'daily_claim', label: 'earn hearts',  emoji: '💗', style: ButtonStyle.Primary },
  );
  if (!theme) {
    return message.reply({ embeds: [errorEmbed('unknown theme id. use `u theme list` to browse ✦')], components: [browseRow] });
  }
  if (theme.cost === 0) {
    const equipRow = buildButtons(
      { id: `tls:${theme.id}:${message.author.id}`, label: 'equip now', emoji: theme.emoji, style: ButtonStyle.Primary },
    );
    return message.reply({ embeds: [errorEmbed(`**${theme.name}** is free — use \`u theme set ${theme.id}\` to equip it ✦`)], components: [equipRow] });
  }
  const owned = getOwnedThemes(message.author.id);
  if (owned.includes(theme.id)) {
    const equipRow = buildButtons(
      { id: `tls:${theme.id}:${message.author.id}`, label: 'equip this theme', emoji: theme.emoji, style: ButtonStyle.Primary },
    );
    return message.reply({ embeds: [errorEmbed(`you already own **${theme.name}** ✦`)], components: [equipRow] });
  }
  const result = buyTheme(message.author.id, theme.id, theme.cost);
  if (!result.success) {
    return message.reply({
      embeds: [errorEmbed(`not enough hearts! need **${theme.cost}** 💗, you have **${result.balance}** ✦`)],
      components: [browseRow],
    });
  }
  const embed = luvEmbed(COLORS.success)
    .setDescription(`${EMOJIS.sparkle} purchased ${theme.emoji} **${theme.name}**! (-${theme.cost} 💗)\nuse \`u theme set ${theme.id}\` to equip it ✦`)
    .setFooter(footer(client));
  const equipRow = buildButtons(
    { id: `tls:${theme.id}:${message.author.id}`, label: 'equip now', emoji: theme.emoji, style: ButtonStyle.Success },
    { id: 'daily_card', label: 'view my card', emoji: '🎴', style: ButtonStyle.Primary },
  );
  await message.reply({ embeds: [embed], components: [equipRow] });
}

async function handlePreview(message, args, client) {
  const id    = args[1]?.toLowerCase() ?? 'lavender';
  const theme = THEME_LIST.find(t => t.id === id);
  if (!theme) {
    return message.reply({ embeds: [errorEmbed('unknown theme id. use `u theme list` to browse ✦')] });
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
      buttons.push({ id: `tlb:${theme.id}:${message.author.id}`, label: `buy (${theme.cost} 💗)`, style: ButtonStyle.Success, emoji: theme.emoji });
    }
    if (owned.includes(theme.id)) {
      buttons.push({ id: `tls:${theme.id}:${message.author.id}`, label: 'equip this theme', style: ButtonStyle.Primary, emoji: theme.emoji });
    }
    const components = buttons.length ? [buildButtons(...buttons)] : [];
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
    .setDescription(`current: ${curr.emoji} **${curr.name}**\n> *${curr.description}*`)
    .addFields(
      { name: 'owned themes', value: owned.map(id => getTheme(id).emoji + ' `' + id + '`').join('  ') || 'none' },
      { name: '💗 hearts',   value: `**${getHearts(message.author.id)}**`, inline: true },
    )
    .setFooter(footer(client));
  const row = buildButtons(
    { id: 'theme_list', label: 'browse themes', emoji: '🎨', style: ButtonStyle.Primary },
  );
  await message.reply({ embeds: [embed], components: [row] });
}

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
