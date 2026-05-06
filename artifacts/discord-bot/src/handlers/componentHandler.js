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
  SeparatorBuilder, SeparatorSpacingSize,
} from 'discord.js';
import { COLORS, EMOJIS, RIZZ_LINES, COMFORT_MESSAGES, getLevelData, getXpBar } from '../config.js';
import {
  HELP_CATEGORIES, HELP_PAGE_SIZE,
  buildHelpCategoryPage, buildHelpMainContainer, buildQuickStartContainer,
} from '../commands/social/help.js';
import { buildTOSContainer, buildProfileFormContainer } from '../commands/social/setup.js';
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

  // Temporary store for pending setup state (gender selected before modal)
  const pendingSetup = new Map();

  return {

    // ── BUTTONS ──────────────────────────────────────────────────────────────
    buttons: {

      // ── Setup: accept T&C → show profile form ─────────────────────────────
      setup_accept: async (i) => {
        const container = buildProfileFormContainer(null);
        await i.update({ flags: CV2, components: [container] });
      },

      // ── Setup: open profile creation modal ────────────────────────────────
      setup_create: async (i) => {
        const pending = pendingSetup.get(i.user.id);
        if (!pending?.gender) {
          return i.reply({ flags: EPH, components: [luvContainer('>  please select your gender first ✦')] });
        }
        const modal = new ModalBuilder()
          .setCustomId('modal_setup')
          .setTitle('Create Your Luvly Profile');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('bio')
              .setLabel('Bio  (required · max 120 chars)')
              .setStyle(TextInputStyle.Paragraph)
              .setMaxLength(120)
              .setMinLength(5)
              .setRequired(true)
              .setPlaceholder('Tell us something about yourself...')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('pronouns')
              .setLabel('Pronouns  (required)')
              .setStyle(TextInputStyle.Short)
              .setMaxLength(30)
              .setRequired(true)
              .setPlaceholder('she/her · he/him · they/them · any...')
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('interests')
              .setLabel('Interests  (optional · comma separated · max 5)')
              .setStyle(TextInputStyle.Short)
              .setMaxLength(150)
              .setRequired(false)
              .setPlaceholder('music, art, late nights, stargazing...')
          ),
        );
        await i.showModal(modal);
      },

      // ── Theme gallery pagination ──────────────────────────────────────────
      tlg: async (i, [pageStr, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ flags: EPH, components: [luvContainer(">  these controls aren't for you ✦")] });
        }
        await i.deferUpdate();
        try {
          const page = await buildThemeListPage(userId, parseInt(pageStr, 10), client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          console.error('[THEME NAV]', err);
          await i.editReply({ flags: CV2, components: [luvContainer('>  failed to load page ✦')], embeds: [], files: [] });
        }
      },

      tlb: async (i, [themeId, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ flags: EPH, components: [luvContainer(">  these controls aren't for you ✦")] });
        }
        const theme = THEME_LIST.find(t => t.id === themeId);
        if (!theme) return i.reply({ flags: EPH, components: [luvContainer('>  theme not found ✦')] });

        const result = buyTheme(userId, themeId, theme.cost);
        if (!result.success) {
          return i.reply({
            flags: EPH,
            components: [luvContainer(`>  not enough hearts! need **${theme.cost}** , you have **${result.balance}** ✦`)],
          });
        }
        await i.deferUpdate();
        const currentPage = THEME_LIST.findIndex(t => t.id === themeId);
        try {
          const page = await buildThemeListPage(userId, currentPage, client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          await i.editReply({ flags: CV2, components: [luvContainer(`>  bought! use \`u theme set ${themeId}\` to equip ✦`)], embeds: [], files: [] });
        }
      },

      tls: async (i, [themeId, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ flags: EPH, components: [luvContainer(">  these controls aren't for you ✦")] });
        }
        const theme = THEME_LIST.find(t => t.id === themeId);
        if (!theme) return i.reply({ flags: EPH, components: [luvContainer('>  theme not found ✦')] });

        const owned = getOwnedThemes(userId);
        if (theme.cost === 0 && !owned.includes(themeId)) buyTheme(userId, themeId, 0);

        const ok = setUserTheme(userId, themeId);
        if (!ok) {
          return i.reply({ flags: EPH, components: [luvContainer(`>  you don't own **${theme.name}** yet ✦`)] });
        }

        await i.deferUpdate();
        const currentPage = THEME_LIST.findIndex(t => t.id === themeId);
        try {
          const page = await buildThemeListPage(userId, currentPage, client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          await i.editReply({ flags: CV2, components: [luvContainer(`>  equipped **${theme.name}**! ✦`)], embeds: [], files: [] });
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
        const heartBar = ''.repeat(hearts) + ''.repeat(10 - hearts);
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
          { id: 'match_again', label: 'another match', emoji: '', style: ButtonStyle.Secondary },
          { id: 'match_crush', label: 'set as crush',  emoji: '', style: ButtonStyle.Primary },
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
              `**﹕ⵌ┆  Not Yet... ꩜ .**\n\n` +
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
            `**﹕ⵌ┆ ${EMOJIS.heart} It's Mutual  ꩜ .**\n\n` +
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
          { id: 'rizz_new',  label: 'new line', emoji: '', style: ButtonStyle.Secondary },
          { id: 'rizz_copy', label: 'use this', emoji: '', style: ButtonStyle.Primary },
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
          { id: 'comfort_more', label: 'i need more',   emoji: '', style: ButtonStyle.Secondary },
          { id: 'comfort_done', label: 'i feel better', emoji: '', style: ButtonStyle.Success },
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
          return await i.reply({ flags: EPH, components: [luvContainer('>  confession not found ✦')] });
        if (conf.authorId !== i.user.id)
          return await i.reply({ flags: EPH, components: [luvContainer(">  this isn't yours to reveal ✦")] });
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
          `**﹕ⵌ┆ ${EMOJIS.streak ?? ''} Daily Claimed ꩜ .**\n\n` +
          `<:right:1501255316350959858> **Rewards:**\n` +
          `> ⤿   XP Earned: **+${result.xp} xp**\n` +
          `> ⤿   Hearts: **+${result.hearts}**\n` +
          `> ⤿   Streak: **${result.streak} days**`;

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
          "you're giving: soft chaos at 2am ",
          'vibe: melancholic but make it aesthetic ',
          'energy: someone who thinks too much and feels even more ',
          "you're giving: quiet storm ",
          'vibe check: emotionally loaded but holding it together ',
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
          `you have **${hearts}  hearts**\n` +
          `use **u shop buy <item_id>** to purchase ✦\n`;

        for (const cat of [...new Set(Object.values(SHOP_ITEMS).map(it => it.category))]) {
          const items = Object.values(SHOP_ITEMS).filter(it => it.category === cat);
          text += `\n${R} **${cat.charAt(0).toUpperCase() + cat.slice(1)}:**\n`;
          for (const it of items) {
            text += `> ⤿  ${it.emoji} \`${it.id}\` — **${it.name}** · ${it.price} \n`;
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
          `${R} **Stats:**  **${hearts}** hearts  ·   **${user.streak ?? 0}** day streak\n\n` +
          `${R} **Interests:** ${interests}`;
        const row = buildButtons(
          { id: 'profile_edit', label: 'edit profile', emoji: '', style: ButtonStyle.Primary },
          { id: 'daily_claim',  label: 'claim daily',  emoji: '', style: ButtonStyle.Success },
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
        const nextStr = next ? `**${next.title}** at ${next.xp.toLocaleString()} xp` : '**max level** ';
        const text =
          `**﹕ⵌ┆ ${EMOJIS.rank} ${i.user.username}'s Rank ꩜ .**\n\n` +
          `${R} **Level & Title:**\n` +
          `> ⤿  Level: **${current.level}** — *${current.title}*\n` +
          `> ⤿  Progress: \`${xpBar}\`\n` +
          `> ⤿  Total XP: **${user.xp ?? 0}**\n` +
          `> ⤿  Next: ${nextStr}\n\n` +
          `${R} **Stats:**\n` +
          `> ⤿  Hearts: **${hearts}**   ·  Streak: **${user.streak ?? 0}** days `;
        const row = buildButtons(
          { id: 'daily_claim', label: 'claim daily', emoji: '', style: ButtonStyle.Primary },
          { id: 'shop_open',   label: 'open shop',   emoji: '', style: ButtonStyle.Secondary },
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
          `**﹕ⵌ┆  ${i.user.username}'s Wallet ꩜ .**\n\n` +
          `${trendEmoji(eco.marketTrend)} market is **${eco.marketTrend}** · ${inflationLabel(eco.inflation)}\n\n` +
          `${R} **Balances:**\n` +
          `> ⤿   Wallet: **${fmt(u.wallet ?? 0)}**\n` +
          `> ⤿   Bank: **${fmt(u.bank ?? 0)}**\n` +
          `> ⤿  Net Worth: **${fmt(net)}**`;
        const row = buildButtons(
          { id: 'eco_deposit', label: 'deposit', emoji: '', style: ButtonStyle.Primary },
          { id: 'eco_work',    label: 'work',    emoji: '', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: EPH, components: [luvContainer(text, row)] });
      },

      eco_work: async (i) => {
        const { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult, getEcoUser } = await import('../utils/economy.js');
        const { getTable, markDirty } = await import('../utils/store.js');
        const userId = i.user.id;
        const u      = getEcoUser(userId);
        const now    = Date.now();
        const COOLDOWN_MS = 30 * 60 * 1_000;
        const waited = now - (u.lastWork ?? 0);
        const R = '<:right:1501255316350959858>';

        if (waited < COOLDOWN_MS) {
          const leftM = Math.ceil((COOLDOWN_MS - waited) / 60_000);
          return i.reply({ flags: EPH, components: [luvContainer(`>  you're still on cooldown. back in **${leftM} min** ✦`)] });
        }

        const JOBS = [
          { title: 'barista', flavor: 'made 47 lattes and smiled through it all' },
          { title: 'graphic designer', flavor: 'delivered a 300-slide deck at 3am' },
          { title: 'streamer', flavor: 'went live for 4 hours, peaked at 3 viewers' },
          { title: 'poet', flavor: 'sold one poem for exactly enough' },
          { title: 'photographer', flavor: 'captured golden hour and nearly cried' },
          { title: 'DJ', flavor: 'dropped a set at a rooftop party' },
          { title: 'cat sitter', flavor: 'watched 4 cats judge you silently' },
          { title: 'florist', flavor: 'arranged 30 bouquets while thinking of someone' },
        ];

        tickMarket();
        const eco    = getEconomy();
        const job    = JOBS[Math.floor(Math.random() * JOBS.length)];
        const mult   = yieldMult();
        const base   = 20 + Math.floor(Math.random() * 40);
        const earned = Math.max(10, Math.floor(base * mult * eco.inflation));
        addToWallet(userId, earned);
        const t = getTable('economy');
        if (t[userId]) { t[userId].lastWork = now; markDirty('economy'); }
        addXP(userId, 3);

        const text =
          `**﹕ⵌ┆ Shift Complete ꩜ .**\n\n` +
          `you worked as a **${job.title}**\n> *${job.flavor}*\n\n` +
          `${R} **Earnings:**\n` +
          `> ⤿   Earned: **${fmt(earned)}**\n` +
          `> ⤿   Wallet: **${fmt(getWallet(userId))}**\n` +
          `> ⤿   Market: ${eco.marketTrend} (×${mult.toFixed(2)})`;

        const row = buildButtons(
          { id: 'eco_deposit', label: 'bank it',  emoji: '', style: ButtonStyle.Primary },
          { id: 'eco_hunt',    label: 'hunt',     emoji: '', style: ButtonStyle.Secondary },
          { id: 'eco_bal',     label: 'balance',  emoji: '', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: CV2, components: [luvContainer(text, row)] });
      },

      eco_fish: async (i) => {
        const { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult, getEcoUser } = await import('../utils/economy.js');
        const { getTable, markDirty } = await import('../utils/store.js');
        const userId = i.user.id;
        const u      = getEcoUser(userId);
        const now    = Date.now();
        const COOLDOWN_MS = 45 * 60 * 1_000;
        const waited = now - (u.lastFish ?? 0);
        const R = '<:right:1501255316350959858>';

        if (waited < COOLDOWN_MS) {
          const leftM = Math.ceil((COOLDOWN_MS - waited) / 60_000);
          return i.reply({ flags: EPH, components: [luvContainer(`>  the fish aren't biting yet. try again in **${leftM} min** ✦`)] });
        }

        const FISH_TABLE = [
          { w: 35, name: 'a soggy boot',         min: 0,   max: 2   },
          { w: 25, name: 'a tiny goldfish',       min: 8,   max: 20  },
          { w: 18, name: 'a plump bass',          min: 25,  max: 50  },
          { w: 10, name: 'a glowing jellyfish',   min: 55,  max: 100 },
          { w:  6, name: 'a moonlit swordfish',   min: 100, max: 180 },
          { w:  4, name: 'a midnight kraken arm', min: 200, max: 400 },
          { w:  2, name: 'THE LOVE WHALE',        min: 500, max: 999 },
        ];
        const totalW = FISH_TABLE.reduce((s, f) => s + f.w, 0);
        let roll = Math.random() * totalW;
        let fish = FISH_TABLE[0];
        for (const f of FISH_TABLE) { roll -= f.w; if (roll <= 0) { fish = f; break; } }

        tickMarket();
        const eco    = getEconomy();
        const mult   = yieldMult();
        const base   = fish.min + Math.floor(Math.random() * Math.max(1, fish.max - fish.min));
        const earned = Math.max(0, Math.floor(base * mult));
        if (earned > 0) addToWallet(userId, earned);
        const t = getTable('economy');
        if (t[userId]) { t[userId].lastFish = now; markDirty('economy'); }
        addXP(userId, 4);

        const isBoot = fish.name.includes('boot');
        const isBig  = fish.w <= 4;
        const catchLine = isBoot
          ? '> *a wet boot. classic.*'
          : isBig ? '>  *legendary catch!*'
          : `> *the water was calm ✦*`;

        const text =
          `**﹕ⵌ┆ You Caught ${fish.name}${isBig ? ' ' : ''} ꩜ .**\n\n` +
          `${catchLine}\n\n` +
          `${R} **Result:**\n` +
          `> ⤿   Earned: ${earned > 0 ? `**${fmt(earned)}**` : '*nothing*'}\n` +
          `> ⤿   Wallet: **${fmt(getWallet(userId))}**\n` +
          `> ⤿   Market: ${eco.marketTrend}`;

        const row = buildButtons(
          { id: 'eco_fish',    label: 'fish again', emoji: '', style: ButtonStyle.Primary },
          { id: 'eco_deposit', label: 'bank it',    emoji: '', style: ButtonStyle.Secondary },
          { id: 'eco_bal',     label: 'balance',    emoji: '', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: CV2, components: [luvContainer(text, row)] });
      },

      eco_hunt: async (i) => {
        const { addToWallet, getWallet, getEconomy, fmt, tickMarket, yieldMult, getEcoUser } = await import('../utils/economy.js');
        const { getTable, markDirty } = await import('../utils/store.js');
        const userId = i.user.id;
        const u      = getEcoUser(userId);
        const now    = Date.now();
        const COOLDOWN_MS = 60 * 60 * 1_000;
        const waited = now - (u.lastHunt ?? 0);
        const R = '<:right:1501255316350959858>';

        if (waited < COOLDOWN_MS) {
          const leftM = Math.ceil((COOLDOWN_MS - waited) / 60_000);
          return i.reply({ flags: EPH, components: [luvContainer(`>  your arrows are recharging. ready in **${leftM} min** ✦`)] });
        }

        const LOOT_TABLE = [
          { w: 30, label: 'a stray kitten',               min: 5,   max: 15  },
          { w: 25, label: 'a wild rabbit',                min: 15,  max: 35  },
          { w: 20, label: 'a rare fox',                   min: 40,  max: 80  },
          { w: 12, label: 'a majestic deer',              min: 70,  max: 130 },
          { w:  7, label: 'a golden eagle',               min: 120, max: 200 },
          { w:  4, label: 'a legendary dragon butterfly', min: 200, max: 350 },
          { w:  2, label: 'THE VOID RABBIT',              min: 400, max: 800 },
        ];
        const totalW = LOOT_TABLE.reduce((s, l) => s + l.w, 0);
        let roll = Math.random() * totalW;
        let loot = LOOT_TABLE[0];
        for (const l of LOOT_TABLE) { roll -= l.w; if (roll <= 0) { loot = l; break; } }

        tickMarket();
        const eco    = getEconomy();
        const mult   = yieldMult();
        const base   = loot.min + Math.floor(Math.random() * (loot.max - loot.min));
        const earned = Math.max(1, Math.floor(base * mult));
        addToWallet(userId, earned);
        const t = getTable('economy');
        if (t[userId]) { t[userId].lastHunt = now; markDirty('economy'); }
        addXP(userId, 5);

        const isRare = loot.w <= 4;
        const text =
          `**﹕ⵌ┆ Hunt Complete ꩜ .**${isRare ? '  RARE FIND!' : ''}\n\n` +
          `you found **${loot.label}**${isRare ? '\n>  *what a catch!*' : ''}\n\n` +
          `${R} **Loot:**\n` +
          `> ⤿   Earned: **${fmt(earned)}**\n` +
          `> ⤿   Wallet: **${fmt(getWallet(userId))}**\n` +
          `> ⤿   Market: ${eco.marketTrend}`;

        const row = buildButtons(
          { id: 'eco_hunt',    label: 'hunt again', emoji: '', style: ButtonStyle.Primary },
          { id: 'eco_deposit', label: 'bank it',    emoji: '', style: ButtonStyle.Secondary },
          { id: 'eco_bal',     label: 'balance',    emoji: '', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: CV2, components: [luvContainer(text, row)] });
      },

      eco_gamble: async (i) => {
        const { getWallet, removeFromWallet, addToWallet, fmt, getEconomy } = await import('../utils/economy.js');
        const userId = i.user.id;
        const wallet = getWallet(userId);
        const R = '<:right:1501255316350959858>';

        if (wallet < 10) {
          return i.reply({ flags: EPH, components: [luvContainer('>  not enough luv to gamble. earn some first ✦')] });
        }

        const amount = Math.min(100_000, Math.max(10, Math.floor(wallet * 0.10)));
        const eco    = getEconomy();
        const houseEdge = Math.min(0.20, 0.08 + (eco.inflation - 1) * 0.15);
        removeFromWallet(userId, amount);

        const SYMBOLS = [
          { s: '', w: 30, mult: 1.5 },
          { s: '', w: 25, mult: 2.0 },
          { s: '', w: 20, mult: 2.5 },
          { s: '', w: 12, mult: 4.0 },
          { s: '', w:  8, mult: 8.0 },
          { s: '', w:  4, mult: 15.0 },
          { s: '', w:  1, mult: 50.0 },
        ];
        const totalW = SYMBOLS.reduce((s, x) => s + x.w, 0);
        const pick = () => {
          let r = Math.random() * totalW;
          for (const sym of SYMBOLS) { r -= sym.w; if (r <= 0) return sym; }
          return SYMBOLS[0];
        };
        const [r0, r1, r2] = [pick(), pick(), pick()];
        const [s1, s2, s3] = [r0.s, r1.s, r2.s];

        let winMult = 0;
        let resultLine = '';
        if (s1 === s2 && s2 === s3) {
          winMult = r0.mult * 3;
          resultLine = ` **JACKPOT!** triple ${s1}!`;
        } else if (s1 === s2 || s2 === s3 || s1 === s3) {
          const matched = s1 === s2 ? r0 : s2 === s3 ? r1 : r0;
          winMult = matched.mult * 0.8;
          resultLine = ` **pair!** two ${matched.s}s`;
        } else {
          resultLine = ' **no match** — better luck next time';
        }

        const grossWin = Math.floor(amount * winMult);
        const netWin   = Math.floor(grossWin * (1 - houseEdge));
        if (netWin > 0) { addToWallet(userId, netWin); addXP(userId, 5); }

        const won    = netWin > 0;
        const profit = netWin - amount;

        const text =
          `**﹕ⵌ┆  Luvly Slots ꩜ .**\n\n` +
          `**[ ${s1}  ${s2}  ${s3} ]**\n\n` +
          `${resultLine}\n\n` +
          `${R} **Result:**\n` +
          `> ⤿   Bet: **${fmt(amount)}** *(10% of wallet)*\n` +
          `> ⤿  ${won ? ' Won' : ' Lost'}: **${fmt(won ? netWin : amount)}**\n` +
          `> ⤿  ${won ? ' Profit' : ' Loss'}: **${fmt(Math.abs(profit))}**\n` +
          `> ⤿   Wallet: **${fmt(getWallet(userId))}**`;

        const row = buildButtons(
          { id: 'eco_gamble',  label: 'spin again',    emoji: '', style: ButtonStyle.Primary },
          { id: 'eco_deposit', label: 'bank winnings', emoji: '', style: ButtonStyle.Success },
          { id: 'eco_bal',     label: 'balance',       emoji: '', style: ButtonStyle.Secondary },
        );
        await i.reply({ flags: CV2, components: [luvContainer(text, row)] });
      },

      eco_deposit: async (i) => {
        const { deposit, getWallet, getBank, fmt } = await import('../utils/economy.js');
        const wallet = getWallet(i.user.id);
        if (wallet <= 0) {
          return i.reply({ flags: EPH, components: [luvContainer('>  nothing in your wallet to deposit ✦')] });
        }
        const result = deposit(i.user.id, wallet);
        const text = result.success
          ? ` deposited **${fmt(wallet)}** into your bank ✦\n> Bank: **${fmt(result.bank ?? 0)}**`
          : '>  deposit failed ✦';
        await i.reply({ flags: EPH, components: [luvContainer(text)] });
      },

      eco_withdraw: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(` use **u bank with <amount>** to withdraw from your bank ✦`)] });
      },

      eco_bank: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(` use **u bank** to view your bank details and rates ✦`)] });
      },

      eco_market: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(` use **u market** to view the live economy dashboard ✦`)] });
      },

      eco_repay: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(` use **u loan repay all** to repay your loan ✦`)] });
      },

      eco_borrow: async (i) => {
        await i.reply({ flags: EPH, components: [luvContainer(` use **u loan 1000** to borrow 1000 luv ✦`)] });
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
          components: [luvContainer(`${EMOJIS.diamond} you'll be notified when premium launches. we gave you **+5 ** for your patience ✦`)],
        });
      },
    },

    // ── SELECTS ──────────────────────────────────────────────────────────────
    selects: {

      // ── Setup: gender selection → enable Create Profile button ───────────
      setup_gender: async (i) => {
        const gender = i.values[0];
        pendingSetup.set(i.user.id, { gender });
        const container = buildProfileFormContainer(gender);
        await i.update({ flags: CV2, components: [container] });
      },

      help_category: async (i, _parts) => {
        const catArg = i.values[0];
        const { container } = buildHelpCategoryPage(catArg, 0);
        await i.update({ flags: CV2, components: [container] });
      },

      shop_preview: async (i, _parts) => {
        const itemId = i.values[0];
        const item   = SHOP_ITEMS[itemId];
        if (!item) return await i.reply({ flags: EPH, components: [luvContainer('>  item not found ✦')] });

        const hearts    = getHearts(i.user.id);
        const canAfford = hearts >= item.price;
        const R         = '<:right:1501255316350959858>';

        const text =
          `**﹕ⵌ┆ ${item.emoji} ${item.name} ꩜ .**\n\n` +
          `${item.desc}\n\n` +
          `${R} **Details:**\n` +
          `> ⤿   Price: **${item.price}**\n` +
          `> ⤿   Your Hearts: **${hearts}**\n` +
          `> ⤿  ${canAfford ? ' you can afford this' : ' not enough hearts'}`;

        await i.reply({ flags: EPH, components: [luvContainer(text)] });
      },
    },

    // ── MODALS ────────────────────────────────────────────────────────────────
    modals: {

      // ── Setup: profile creation modal submission ──────────────────────────
      modal_setup: async (i) => {
        const bio        = i.fields.getTextInputValue('bio')?.trim();
        const pronouns   = i.fields.getTextInputValue('pronouns')?.trim();
        const interestsR = i.fields.getTextInputValue('interests')?.trim() || '';
        const interests  = interestsR
          ? interestsR.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
          : [];

        if (!bio || bio.length < 5) {
          return i.reply({ flags: EPH, components: [luvContainer('>  bio must be at least 5 characters ✦')] });
        }
        if (!pronouns) {
          return i.reply({ flags: EPH, components: [luvContainer('>  pronouns are required ✦')] });
        }

        const gender = pendingSetup.get(i.user.id)?.gender ?? null;
        pendingSetup.delete(i.user.id);

        saveUser(i.user.id, {
          bio,
          pronouns,
          interests,
          gender,
          setupComplete: true,
        });

        const { oldXP, newXP } = addXP(i.user.id, 50);
        await unlock(i.user.id, 'first_profile', client);
        await checkLevelUp(i.user.id, oldXP, newXP, i.channel, client);

        const R = '<:right:1501255316350959858>';
        const genderLabel = gender
          ? gender.charAt(0).toUpperCase() + gender.slice(1)
          : 'Not specified';

        const loadingContainer = luvContainer(
          `>  creating your profile...\n\n*just a moment ✦*`
        );
        await i.reply({ flags: MessageFlags.IsComponentsV2, components: [loadingContainer] });

        await new Promise(r => setTimeout(r, 1500));

        const congratsText =
          `**﹕ⵌ┆ <:luvly:1501269739324838151> Welcome to Luvly 🎉 ꩜ .**\n\n` +
          `**Congratulations, ${i.user.username}! Your profile is live.**\n\n` +
          `${R} **Your Profile:**\n` +
          `> ⤿  Bio: *"${bio}"*\n` +
          `> ⤿  Pronouns: **${pronouns}**\n` +
          `> ⤿  Gender: **${genderLabel}**\n` +
          (interests.length
            ? `> ⤿  Interests: ${interests.map(x => `\`${x}\``).join('  ')}\n`
            : '') +
          `\n${R} **What's next:**\n` +
          `> ⤿  \`luv daily\` — claim your first daily reward\n` +
          `> ⤿  \`luv match\` — find your first match\n` +
          `> ⤿  \`luv profile\` — view your full profile\n` +
          `> ⤿  \`luv help\` — explore all commands\n\n` +
          `*you're part of the luvly family now ✦*`;

        const row = buildButtons(
          { id: 'daily_claim',  label: 'Claim Daily',  emoji: '', style: ButtonStyle.Success   },
          { id: 'profile_view', label: 'My Profile',   emoji: '', style: ButtonStyle.Primary   },
          { id: 'match_again',  label: 'Find a Match', emoji: '', style: ButtonStyle.Secondary },
        );

        await i.editReply({
          flags: MessageFlags.IsComponentsV2,
          components: [luvContainer(congratsText, row)],
        });
      },

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
          { id: `confess_reveal:${conf.id}`, label: 'reveal identity', emoji: '', style: ButtonStyle.Danger },
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
