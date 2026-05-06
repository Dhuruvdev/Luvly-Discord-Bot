/**
 * Component handler — buttons, select menus, modals.
 * All interaction IDs follow the pattern:  action[:param1[:param2]]
 *
 * Wire-ups:
 *   Buttons  → handlers.buttons[action]
 *   Selects  → handlers.selects[action]
 *   Modals   → handlers.modals[action]
 */

import {
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ContainerBuilder, TextDisplayBuilder, StringSelectMenuBuilder, MessageFlags,
} from 'discord.js';
import { COLORS, EMOJIS, RIZZ_LINES, COMFORT_MESSAGES, getLevelData, getXpBar } from '../config.js';
import {
  HELP_CATEGORIES, HELP_PAGE_SIZE,
  buildHelpCategoryPage, buildHelpMainContainer, buildQuickStartContainer,
} from '../commands/social/help.js';
import { luvContainer, buildButtons, errorEmbed } from '../utils/embeds.js';
import {
  getUser, saveUser, addXP, addHearts, getHearts, spendHearts,
  setCrush, getCrush, checkMutualCrush,
  getChemistry, addChemistry,
  revealConfession, getConfession, addConfession,
  claimDaily, blockUser,
  setUserTheme, buyTheme, getOwnedThemes,
} from '../utils/database.js';
import { unlock } from '../utils/achievements.js';
import { checkLevelUp } from '../utils/levelUp.js';
import { SHOP_ITEMS } from '../commands/engagement/shop.js';
import { buildThemeListPage } from '../utils/themeListPage.js';
import { THEME_LIST } from '../themes/index.js';

const CV2 = MessageFlags.IsComponentsV2;
const EPH = MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral;

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function buildHandlers(client) {
  return {

    // ── BUTTONS ──────────────────────────────────────────────────────────────
    buttons: {

      // ── Theme gallery pagination ──────────────────────────────────────────
      tlg: async (i, [pageStr, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ flags: EPH, components: [luvContainer("> ⚠️ these controls aren't for you ✦")] });
        }
        await i.deferUpdate();
        try {
          const page = await buildThemeListPage(userId, parseInt(pageStr, 10), client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          console.error('[THEME NAV]', err);
          await i.editReply({ flags: CV2, components: [luvContainer('> ⚠️ failed to load page ✦')], embeds: [], files: [] });
        }
      },

      tlb: async (i, [themeId, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ flags: EPH, components: [luvContainer("> ⚠️ these controls aren't for you ✦")] });
        }
        const theme = THEME_LIST.find(t => t.id === themeId);
        if (!theme) return i.reply({ flags: EPH, components: [luvContainer('> ⚠️ theme not found ✦')] });

        const result = buyTheme(userId, themeId, theme.cost);
        if (!result.success) {
          return i.reply({
            flags: EPH,
            components: [luvContainer(`> ⚠️ not enough hearts! need **${theme.cost}** 💗, you have **${result.balance}** ✦`)],
          });
        }
        await i.deferUpdate();
        const currentPage = THEME_LIST.findIndex(t => t.id === themeId);
        try {
          const page = await buildThemeListPage(userId, currentPage, client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          await i.editReply({ flags: CV2, components: [luvContainer(`> ✅ bought! use \`u theme set ${themeId}\` to equip ✦`)], embeds: [], files: [] });
        }
      },

      tls: async (i, [themeId, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ flags: EPH, components: [luvContainer("> ⚠️ these controls aren't for you ✦")] });
        }
        const theme = THEME_LIST.find(t => t.id === themeId);
        if (!theme) return i.reply({ flags: EPH, components: [luvContainer('> ⚠️ theme not found ✦')] });

        const owned = getOwnedThemes(userId);
        if (theme.cost === 0 && !owned.includes(themeId)) buyTheme(userId, themeId, 0);

        const ok = setUserTheme(userId, themeId);
        if (!ok) {
          return i.reply({ flags: EPH, components: [luvContainer(`> ⚠️ you don't own **${theme.name}** yet ✦`)] });
        }

        await i.deferUpdate();
        const currentPage = THEME_LIST.findIndex(t => t.id === themeId);
        try {
          const page = await buildThemeListPage(userId, currentPage, client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          await i.editReply({ flags: CV2, components: [luvContainer(`> ✅ equipped **${theme.name}**! ✦`)], embeds: [], files: [] });
        }
      },

      // ── Profile ────────────────────────────────────────────────────────────
      profile_edit: async (i) => {
        const modal = new ModalBuilder().setCustomId('modal_edit_profile').setTitle('edit your profile ✦');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('bio').setLabel('bio  (max 120 chars)')
              .setStyle(TextInputStyle.Paragraph).setMaxLength(120).setRequired(false)
              .setPlaceholder('something soft about you...')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('pronouns').setLabel('pronouns')
              .setStyle(TextInputStyle.Short).setMaxLength(30).setRequired(false)
              .setPlaceholder('she/her · he/him · they/them · etc')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('interests').setLabel('interests  (comma separated)')
              .setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false)
              .setPlaceholder('music, art, late nights, stargazing...')
          ),
        );
        await i.showModal(modal);
      },

      profile_aura: async (i) => {
        const auras = ['soft', 'ethereal', 'magnetic', 'chaotic', 'midnight', 'golden'];
        const user  = getUser(i.user.id);
        const next  = auras[(auras.indexOf(user.aura ?? 'soft') + 1) % auras.length];
        saveUser(i.user.id, { aura: next });
        await i.update({
          flags: CV2,
          components: [luvContainer(`**﹕ⵌ┆ ${EMOJIS.aura} Aura Updated ꩜ .**\n\nyour aura is now **${next}** ✦`)],
        });
      },

      // ── Match ──────────────────────────────────────────────────────────────
      match_again: async (i) => {
        const guild   = i.guild;
        const members = guild?.members.cache.filter(m => !m.user.bot).map(m => m.user) ?? [];
        const picked  = members.length ? members[Math.floor(Math.random() * members.length)] : null;
        const compat  = 60 + Math.floor(Math.random() * 40);
        const hearts  = Math.round(compat / 10);
        const heartBar = '❤️'.repeat(hearts) + '🤍'.repeat(10 - hearts);
        const vibes    = ['soft', 'ethereal', 'magnetic', 'chaotic', 'midnight', 'golden'];
        const vibe     = vibes[Math.floor(Math.random() * vibes.length)];

        const text =
          `**﹕ⵌ┆ ${EMOJIS.match} New Match Found ꩜ .**\n\n` +
          `<:right:1501255316350959858> **Your Match:**\n` +
          `> ⤿  Matched with: **${picked?.username ?? 'a mysterious stranger'}**\n` +
          `> ⤿  Compatibility: **${compat}%**\n` +
          `> ⤿  Heart score: ${heartBar}\n` +
          `> ⤿  Their vibe: **${vibe}**`;

        const row = buildButtons(
          { id: 'match_again', label: 'another match', emoji: '🔄', style: ButtonStyle.Secondary },
          { id: 'match_crush', label: 'set as crush',  emoji: '💌', style: ButtonStyle.Primary },
        );
        await i.update({ flags: CV2, components: [luvContainer(text, row)] });
      },

      match_crush: async (i) => {
        await i.reply({
          flags: EPH,
          components: [luvContainer(`${EMOJIS.heart} use **u crush @user** to set a real crush ✦`)],
        });
      },

      // ── Crush ──────────────────────────────────────────────────────────────
      crush_reveal: async (i, [targetId]) => {
        const mutual = checkMutualCrush(i.user.id, targetId);
        if (!mutual) {
          return await i.reply({
            flags: EPH,
            components: [luvContainer(
              `**﹕ⵌ┆ 🔒 Not Yet... ꩜ .**\n\n` +
              `they haven't set their crush yet.\n` +
              `if they choose you too, you'll both be revealed ✦`
            )],
          });
        }
        const target = await client.users.fetch(targetId).catch(() => null);
        await unlock(i.user.id, 'mutual_crush', client);
        await i.update({
          flags: CV2,
          components: [luvContainer(
            `**﹕ⵌ┆ ${EMOJIS.heart} It's Mutual 💞 ꩜ .**\n\n` +
            `you and **${target?.username ?? 'them'}** both have a crush on each other.\n\ndon't waste it ✦`
          )],
        });
      },

      crush_anonymous: async (i) => {
        await i.reply({
          flags: EPH,
          components: [luvContainer(`${EMOJIS.confession} your crush is anonymous. they'll never know unless it's mutual ✦`)],
        });
      },

      // ── Rizz ───────────────────────────────────────────────────────────────
      rizz_new: async (i) => {
        const line = randomFrom(RIZZ_LINES);
        const text = `**﹕ⵌ┆ ${EMOJIS.rizz} Fresh Line ꩜ .**\n\n> *"${line}"*`;
        const row  = buildButtons(
          { id: 'rizz_new',  label: 'new line', emoji: '🔄', style: ButtonStyle.Secondary },
          { id: 'rizz_copy', label: 'use this', emoji: '💌', style: ButtonStyle.Primary },
        );
        await i.update({ flags: CV2, components: [luvContainer(text, row)] });
      },

      rizz_copy: async (i) => {
        await i.reply({
          flags: EPH,
          components: [luvContainer(`${EMOJIS.sparkle} go get them. you've got this ✦`)],
        });
      },

      // ── Comfort ────────────────────────────────────────────────────────────
      comfort_more: async (i) => {
        const msg = randomFrom(COMFORT_MESSAGES);
        const text = `**﹕ⵌ┆ ${EMOJIS.moon} Still Here ꩜ .**\n\n> *"${msg}"*`;
        const row  = buildButtons(
          { id: 'comfort_more', label: 'i need more',   emoji: '🌙', style: ButtonStyle.Secondary },
          { id: 'comfort_done', label: 'i feel better', emoji: '✨', style: ButtonStyle.Success },
        );
        await i.update({ flags: CV2, components: [luvContainer(text, row)] });
      },

      comfort_done: async (i) => {
        await i.update({
          flags: CV2,
          components: [luvContainer(`${EMOJIS.sparkle} that's everything. keep going ✦`)],
        });
      },

      // ── Confession ─────────────────────────────────────────────────────────
      confess_open: async (i) => {
        const modal = new ModalBuilder().setCustomId('modal_confess').setTitle('anonymous confession ✦');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('confession').setLabel('what do you need to say?')
              .setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(true)
              .setPlaceholder('say it here. nobody will know it was you...')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('target').setLabel('for someone? (username or leave blank)')
              .setStyle(TextInputStyle.Short).setRequired(false)
              .setPlaceholder('optional — leave empty for general confession')
          ),
        );
        await i.showModal(modal);
      },

      confess_reveal: async (i, [confessionId]) => {
        const conf = getConfession(confessionId);
        if (!conf)
          return await i.reply({ flags: EPH, components: [luvContainer('> ⚠️ confession not found ✦')] });
        if (conf.authorId !== i.user.id)
          return await i.reply({ flags: EPH, components: [luvContainer("> ⚠️ this isn't yours to reveal ✦")] });
        revealConfession(confessionId);
        await i.update({
          flags: CV2,
          components: [luvContainer(
            `**﹕ⵌ┆ ${EMOJIS.confession} Confession Revealed ꩜ .**\n\n` +
            `*"${conf.text}"*\n\n` +
            `revealed by **${i.user.username}**`
          )],
        });
      },

      // ── Daily ──────────────────────────────────────────────────────────────
      daily_claim: async (i) => {
        const result = claimDaily(i.user.id);
        if (!result.success) {
          return await i.reply({
            flags: EPH,
            components: [luvContainer(`${EMOJIS.moon} already claimed. come back in **${result.waitH}h ${result.waitM}m** ✦`)],
          });
        }

        await checkLevelUp(i.user.id, result.oldXP, result.newXP, i.channel, client);

        if (result.streak >= 3)  await unlock(i.user.id, 'streak_3',  client);
        if (result.streak >= 7)  await unlock(i.user.id, 'streak_7',  client);
        if (result.streak >= 30) await unlock(i.user.id, 'streak_30', client);

        const text =
          `**﹕ⵌ┆ ${EMOJIS.streak ?? '⭐'} Daily Claimed ꩜ .**\n\n` +
          `<:right:1501255316350959858> **Rewards:**\n` +
          `> ⤿  ⭐ XP Earned: **+${result.xp} xp**\n` +
          `> ⤿  💗 Hearts: **+${result.hearts}**\n` +
          `> ⤿  🔥 Streak: **${result.streak} days**`;

        await i.update({ flags: CV2, components: [luvContainer(text)] });
      },

      // ── Chemistry boost ────────────────────────────────────────────────────
      chem_boost: async (i, [targetId]) => {
        const newScore = addChemistry(i.user.id, targetId, 5);
        const target   = await client.users.fetch(targetId).catch(() => null);
        if (newScore >= 100) await unlock(i.user.id, 'chem_100', client);
        if (newScore >= 200) await unlock(i.user.id, 'chem_200', client);
        await i.reply({
          flags: EPH,
          components: [luvContainer(`${EMOJIS.chemistry} chemistry with **${target?.username ?? 'them'}** boosted to **${newScore}**/200 ✦`)],
        });
      },

      // ── Midnight ───────────────────────────────────────────────────────────
      midnight_confess: async (i) => {
        const modal = new ModalBuilder().setCustomId('modal_midnight_confess').setTitle('midnight confession ✦');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('thought').setLabel("what's on your mind right now?")
              .setStyle(TextInputStyle.Paragraph).setMaxLength(300).setRequired(true)
              .setPlaceholder("say the thing you've been keeping inside...")
          ),
        );
        await i.showModal(modal);
      },

      midnight_comfort: async (i) => {
        const msg = randomFrom(COMFORT_MESSAGES);
        await i.reply({
          flags: EPH,
          components: [luvContainer(`**﹕ⵌ┆ ${EMOJIS.moon} Midnight Comfort ꩜ .**\n\n> *"${msg}"*`)],
        });
      },

      midnight_vibe: async (i) => {
        const vibes = [
          "you're giving: soft chaos at 2am ✨",
          'vibe: melancholic but make it aesthetic 🌙',
          'energy: someone who thinks too much and feels even more 💫',
          "you're giving: quiet storm 🌧️",
          'vibe check: emotionally loaded but holding it together 💜',
        ];
        await i.reply({
          flags: EPH,
          components: [luvContainer(randomFrom(vibes))],
        });
      },

      // ── Shop ───────────────────────────────────────────────────────────────
      shop_open: async (i) => {
        const hearts = getHearts(i.user.id);
        const R      = '<:right:1501255316350959858>';

        let text =
          `**﹕ⵌ┆ ${EMOJIS.diamond} Luvly Shop ꩜ .**\n\n` +
          `you have **${hearts} 💗 hearts**\n` +
          `use **u shop buy <item_id>** to purchase ✦\n`;

        for (const cat of [...new Set(Object.values(SHOP_ITEMS).map(it => it.category))]) {
          const items = Object.values(SHOP_ITEMS).filter(it => it.category === cat);
          text += `\n${R} **${cat.charAt(0).toUpperCase() + cat.slice(1)}:**\n`;
          for (const it of items) {
            text += `> ⤿  ${it.emoji} \`${it.id}\` — **${it.name}** · ${it.price} 💗\n`;
          }
        }

        await i.reply({ flags: EPH, components: [luvContainer(text)] });
      },

      // ── Quick navigation shortcuts ────────────────────────────────────────
      profile_view: async (i) => {
        const { getUser, getHearts } = await import('../utils/database.js');
        const { getUserAchievements } = await import('../utils/achievements.js');
        const { getLevelData, getXpBar } = await import('../config.js');
        const R = '<:right:1501255316350959858>';
        const user     = getUser(i.user.id);
        const hearts   = getHearts(i.user.id);
        const unlocked = getUserAchievements(i.user.id);
        const { current, next } = getLevelData(user.xp ?? 0);
        const xpBar    = getXpBar(user.xp ?? 0, current, next);
        const interests = user.interests?.length ? user.interests.map(x => `\`${x}\``).join('  ') : '*none*';
        const bio = user.bio ? `> *"${user.bio}"*` : '> *no bio yet — add one with* `u profile edit`';
        const text =
          `**﹕ⵌ┆ ${EMOJIS.star} ${i.user.username} ꩜ .**\n\n${bio}\n\n` +
          `${R} **Level:** **${current.level}** — *${current.title}*\n` +
          `> ⤿  \`${xpBar}\`\n\n` +
          `${R} **Stats:** ❤️ **${hearts}** hearts  ·  🔥 **${user.streak ?? 0}** day streak\n\n` +
          `${R} **Interests:** ${interests}`;
        const row = buildButtons(
          { id: 'profile_edit', label: 'edit profile', emoji: '✏️', style: ButtonStyle.Primary },
          { id: 'daily_claim',  label: 'claim daily',  emoji: '🎁', style: ButtonStyle.Success },
        );
        await i.reply({ flags: EPH, components: [luvContainer(text, row)] });
      },

      rank_view: async (i) => {
        const { getUser, getHearts } = await import('../utils/database.js');
        const { getLevelData, getXpBar } = await import('../config.js');
        const R = '<:right:1501255316350959858>';
        const user   = getUser(i.user.id);
        const hearts = getHearts(i.user.id);
        const { current, next } = getLevelData(user.xp ?? 0);
        const xpBar  = getXpBar(user.xp ?? 0, current, next);
        const nextStr = next ? `**${next.title}** at ${next.xp.toLocaleString()} xp` : '**max level** 👑';
        const text =
          `**﹕ⵌ┆ ${EMOJIS.rank} ${i.user.username}'s Rank ꩜ .**\n\n` +
          `${R} **Level & Title:**\n` +
          `> ⤿  Level: **${current.level}** — *${current.title}*\n` +
          `> ⤿  Progress: \`${xpBar}\`\n` +
          `> ⤿  Total XP: **${user.xp ?? 0}**\n` +
          `> ⤿  Next: ${nextStr}\n\n` +
          `${R} **Stats:**\n` +
          `> ⤿  Hearts: **${hearts}** 💗  ·  Streak: **${user.streak ?? 0}** days 🔥`;
        const row = buildButtons(
          { id: 'daily_claim', label: 'claim daily', emoji: '🎁', style: ButtonStyle.Primary },
          { id: 'shop_open',   label: 'open shop',   emoji: '💗', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: EPH, components: [luvContainer(text, row)] });
      },

      lb_view: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`${EMOJIS.crown} use **u leaderboard** to view the full rankings ✦`)] });
      },

      daily_card: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`${EMOJIS.sparkle} use **u card** to generate your profile card ✦`)] });
      },

      theme_list: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`${EMOJIS.sparkle} use **u theme list** to browse all themes ✦`)] });
      },

      // ── Economy button shortcuts ───────────────────────────────────────────
      eco_bal: async (i) => {
        const { getEcoUser, getNetWorth, fmt, accrueInterest, getEconomy, trendEmoji, inflationLabel } = await import('../utils/economy.js');
        const R = '<:right:1501255316350959858>';
        accrueInterest(i.user.id);
        const u   = getEcoUser(i.user.id);
        const eco = getEconomy();
        const net = getNetWorth(i.user.id);
        const text =
          `**﹕ⵌ┆ 👛 ${i.user.username}'s Wallet ꩜ .**\n\n` +
          `${trendEmoji(eco.marketTrend)} market is **${eco.marketTrend}** · ${inflationLabel(eco.inflation)}\n\n` +
          `${R} **Balances:**\n` +
          `> ⤿  👛 Wallet: **${fmt(u.wallet ?? 0)}**\n` +
          `> ⤿  🏦 Bank: **${fmt(u.bank ?? 0)}**\n` +
          `> ⤿  Net Worth: **${fmt(net)}**`;
        const row = buildButtons(
          { id: 'eco_deposit', label: 'deposit', emoji: '🏦', style: ButtonStyle.Primary },
          { id: 'eco_work',    label: 'work',    emoji: '💼', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: EPH, components: [luvContainer(text, row)] });
      },

      eco_work: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`${EMOJIS.sparkle} use **u work** to do a shift and earn luv ✦`)] });
      },

      eco_fish: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`🎣 use **u fish** to go fishing and earn luv ✦`)] });
      },

      eco_hunt: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`🏹 use **u hunt** to go hunting and earn luv ✦`)] });
      },

      eco_gamble: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`🎰 use **u gamble <amount>** to spin the slots ✦`)] });
      },

      eco_deposit: async (i) => {
        const { deposit, getWallet, getBank, fmt } = await import('../utils/economy.js');
        const wallet = getWallet(i.user.id);
        if (wallet <= 0) {
          return i.reply({ flags: EPH, components: [luvContainer('> ⚠️ nothing in your wallet to deposit ✦')] });
        }
        const result = deposit(i.user.id, wallet);
        const text = result.success
          ? `🏦 deposited **${fmt(wallet)}** into your bank ✦\n> Bank: **${fmt(result.bank ?? 0)}**`
          : '> ⚠️ deposit failed ✦';
        await i.reply({ flags: EPH, components: [luvContainer(text)] });
      },

      eco_withdraw: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`👛 use **u bank with <amount>** to withdraw from your bank ✦`)] });
      },

      eco_bank: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`🏦 use **u bank** to view your bank details and rates ✦`)] });
      },

      eco_market: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`📊 use **u market** to view the live economy dashboard ✦`)] });
      },

      eco_repay: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`✅ use **u loan repay all** to repay your loan ✦`)] });
      },

      eco_borrow: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(`💳 use **u loan 1000** to borrow 1000 luv ✦`)] });
      },

      // ── Help: go home ─────────────────────────────────────────────────────
      help_home: async (i) => {
        const container = buildHelpMainContainer(client);
        await i.update({ flags: CV2, components: [container] });
      },

      // ── Help: quick start ─────────────────────────────────────────────────
      help_quickstart: async (i) => {
        const container = buildQuickStartContainer();
        await i.update({ flags: CV2, components: [container] });
      },

      // ── Help: pagination ──────────────────────────────────────────────────
      help_page: async (i, [catArg, pageStr]) => {
        const page = parseInt(pageStr, 10) || 0;
        const { container } = buildHelpCategoryPage(catArg, page);
        await i.update({ flags: CV2, components: [container] });
      },

      // ── Premium notify ─────────────────────────────────────────────────────
      premium_interest: async (i) => {
        addHearts(i.user.id, 5);
        await i.reply({
          flags: EPH,
          components: [luvContainer(`${EMOJIS.diamond} you'll be notified when premium launches. we gave you **+5 💗** for your patience ✦`)],
        });
      },
    },

    // ── SELECTS ──────────────────────────────────────────────────────────────
    selects: {

      help_category: async (i, _parts) => {
        const catArg = i.values[0];
        const { container } = buildHelpCategoryPage(catArg, 0);
        await i.update({ flags: CV2, components: [container] });
      },

      shop_preview: async (i, _parts) => {
        const itemId = i.values[0];
        const item   = SHOP_ITEMS[itemId];
        if (!item) return await i.reply({ flags: EPH, components: [luvContainer('> ⚠️ item not found ✦')] });

        const hearts    = getHearts(i.user.id);
        const canAfford = hearts >= item.price;
        const R         = '<:right:1501255316350959858>';

        const text =
          `**﹕ⵌ┆ ${item.emoji} ${item.name} ꩜ .**\n\n` +
          `${item.desc}\n\n` +
          `${R} **Details:**\n` +
          `> ⤿  💗 Price: **${item.price}**\n` +
          `> ⤿  💰 Your Hearts: **${hearts}**\n` +
          `> ⤿  ${canAfford ? '✅ you can afford this' : '❌ not enough hearts'}`;

        await i.reply({ flags: EPH, components: [luvContainer(text)] });
      },
    },

    // ── MODALS ────────────────────────────────────────────────────────────────
    modals: {

      modal_edit_profile: async (i) => {
        const bio        = i.fields.getTextInputValue('bio')?.trim()       || null;
        const pronouns   = i.fields.getTextInputValue('pronouns')?.trim()  || null;
        const interestsR = i.fields.getTextInputValue('interests')?.trim() || '';
        const interests  = interestsR ? interestsR.split(',').map(s => s.trim()).filter(Boolean) : [];
        saveUser(i.user.id, { bio, pronouns, interests });

        await unlock(i.user.id, 'first_profile', client);

        await i.reply({
          flags: EPH,
          components: [luvContainer(`**﹕ⵌ┆ ${EMOJIS.aura} Profile Updated ꩜ .**\n\nyour profile has been saved ✦`)],
        });
      },

      modal_confess: async (i) => {
        const text       = i.fields.getTextInputValue('confession');
        const targetName = i.fields.getTextInputValue('target')?.trim() || null;
        const conf       = addConfession(i.user.id, text, targetName);
        const { oldXP, newXP } = addXP(i.user.id, 15);
        await checkLevelUp(i.user.id, oldXP, newXP, i.channel, client);
        await unlock(i.user.id, 'confessor', client);

        const confText =
          `**﹕ⵌ┆ ${EMOJIS.confession} Anonymous Confession ꩜ .**\n\n` +
          (targetName ? `*to ${targetName}:*\n\n` : '') +
          `*"${text}"*\n\n` +
          `> *confession · id: ${conf.id}*`;

        const row = buildButtons(
          { id: `confess_reveal:${conf.id}`, label: 'reveal identity', emoji: '🔓', style: ButtonStyle.Danger },
        );
        await i.reply({ flags: CV2, components: [luvContainer(confText, row)] });
      },

      modal_midnight_confess: async (i) => {
        const thought = i.fields.getTextInputValue('thought');
        const { oldXP, newXP } = addXP(i.user.id, 10);
        await checkLevelUp(i.user.id, oldXP, newXP, i.channel, client);
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const text =
          `**﹕ⵌ┆ ${EMOJIS.moon} Midnight Thought ꩜ .**\n\n` +
          `*"${thought}"*\n\n` +
          `> *— anonymous soul, ${time}*`;
        await i.reply({ flags: CV2, components: [luvContainer(text)] });
      },
    },
  };
}
