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
} from 'discord.js';
import { COLORS, EMOJIS, RIZZ_LINES, COMFORT_MESSAGES, getLevelData, getXpBar } from '../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../utils/embeds.js';
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

// ── Helper ────────────────────────────────────────────────────────────────────
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export function buildHandlers(client) {
  return {

    // ── BUTTONS ──────────────────────────────────────────────────────────────
    buttons: {

      // ── Theme gallery pagination ──────────────────────────────────────────
      // tlg:{pageIdx}:{userId}  — navigate
      // tlb:{themeId}:{userId}  — buy
      // tls:{themeId}:{userId}  — set/equip

      tlg: async (i, [pageStr, userId]) => {
        // Only the original user may click
        if (i.user.id !== userId) {
          return i.reply({ embeds: [errorEmbed('these controls aren\'t for you ✦')], ephemeral: true });
        }
        await i.deferUpdate();
        try {
          const page = await buildThemeListPage(userId, parseInt(pageStr, 10), client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          console.error('[THEME NAV]', err);
          await i.editReply({ embeds: [errorEmbed('failed to load page ✦')], components: [] });
        }
      },

      tlb: async (i, [themeId, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ embeds: [errorEmbed('these controls aren\'t for you ✦')], ephemeral: true });
        }
        const theme = THEME_LIST.find(t => t.id === themeId);
        if (!theme) return i.reply({ embeds: [errorEmbed('theme not found ✦')], ephemeral: true });

        const result = buyTheme(userId, themeId, theme.cost);
        if (!result.success) {
          return i.reply({
            embeds: [errorEmbed(`not enough hearts! need **${theme.cost}** 💗, you have **${result.balance}** ✦`)],
            ephemeral: true,
          });
        }
        // Refresh the current page so the button updates to "equip"
        await i.deferUpdate();
        const currentPage = THEME_LIST.findIndex(t => t.id === themeId);
        try {
          const page = await buildThemeListPage(userId, currentPage, client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          await i.editReply({ embeds: [errorEmbed('bought! use `u theme set ' + themeId + '` to equip ✦')], components: [] });
        }
      },

      tls: async (i, [themeId, userId]) => {
        if (i.user.id !== userId) {
          return i.reply({ embeds: [errorEmbed('these controls aren\'t for you ✦')], ephemeral: true });
        }
        const theme  = THEME_LIST.find(t => t.id === themeId);
        if (!theme) return i.reply({ embeds: [errorEmbed('theme not found ✦')], ephemeral: true });

        const owned = getOwnedThemes(userId);
        // Auto-grant free themes
        if (theme.cost === 0 && !owned.includes(themeId)) {
          buyTheme(userId, themeId, 0);
        }
        const ok = setUserTheme(userId, themeId);
        if (!ok) {
          return i.reply({ embeds: [errorEmbed(`you don't own **${theme.name}** yet ✦`)], ephemeral: true });
        }

        await i.deferUpdate();
        const currentPage = THEME_LIST.findIndex(t => t.id === themeId);
        try {
          const page = await buildThemeListPage(userId, currentPage, client, i.user);
          await i.editReply({ embeds: [page.embed], files: page.files, components: page.components });
        } catch (err) {
          await i.editReply({ embeds: [errorEmbed(`equipped **${theme.name}**! ✦`)], components: [] });
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
        const auraColors = { soft: COLORS.soft, ethereal: COLORS.purple, magnetic: COLORS.primary, chaotic: COLORS.rose, midnight: COLORS.midnight, golden: COLORS.gold };
        const embed = luvEmbed(auraColors[next] ?? COLORS.primary)
          .setTitle(`${EMOJIS.aura} aura updated`)
          .setDescription(`your aura is now **${next}** ✦`)
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
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
        const embed = luvEmbed(COLORS.primary)
          .setTitle(`${EMOJIS.match} new match found`)
          .addFields(
            { name: 'matched with',   value: picked ? `**${picked.username}**` : '*mysterious stranger*', inline: true },
            { name: 'compatibility', value: `**${compat}%**`, inline: true },
            { name: '\u200b',        value: heartBar },
          )
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'match_again', label: 'another match', emoji: '🔄', style: ButtonStyle.Secondary },
          { id: 'match_crush',  label: 'set as crush',  emoji: '💌', style: ButtonStyle.Primary },
        );
        await i.update({ embeds: [embed], components: [row] });
      },

      match_crush: async (i) => {
        const embed = luvEmbed(COLORS.rose)
          .setDescription(`${EMOJIS.heart} use **u crush @user** to set a real crush ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Crush ──────────────────────────────────────────────────────────────
      crush_reveal: async (i, [targetId]) => {
        const mutual = checkMutualCrush(i.user.id, targetId);
        if (!mutual) {
          const embed = luvEmbed(COLORS.midnight)
            .setTitle('🔒 not yet...')
            .setDescription('they haven\'t set their crush yet.\nif they choose you too, you\'ll both be revealed ✦')
            .setFooter(footer(client));
          return await i.reply({ embeds: [embed], ephemeral: true });
        }
        const target = await client.users.fetch(targetId).catch(() => null);
        await unlock(i.user.id, 'mutual_crush', client);
        const embed = luvEmbed(COLORS.rose)
          .setTitle(`${EMOJIS.heart} it's mutual 💞`)
          .setDescription(`you and **${target?.username ?? 'them'}** both have a crush on each other.\n\ndon't waste it ✦`)
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      crush_anonymous: async (i) => {
        const embed = luvEmbed(COLORS.purple)
          .setDescription(`${EMOJIS.confession} your crush is anonymous. they'll never know unless it's mutual ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Rizz ──────────────────────────────────────────────────────────────
      rizz_new: async (i) => {
        const line = randomFrom(RIZZ_LINES);
        const embed = luvEmbed(COLORS.aura)
          .setTitle(`${EMOJIS.rizz} fresh line ✦`)
          .setDescription(`*"${line}"*`)
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'rizz_new',  label: 'new line', emoji: '🔄', style: ButtonStyle.Secondary },
          { id: 'rizz_copy', label: 'use this', emoji: '💌', style: ButtonStyle.Primary },
        );
        await i.update({ embeds: [embed], components: [row] });
      },

      rizz_copy: async (i) => {
        const embed = luvEmbed(COLORS.success)
          .setDescription(`${EMOJIS.sparkle} go get them. you've got this ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Comfort ────────────────────────────────────────────────────────────
      comfort_more: async (i) => {
        const msg = randomFrom(COMFORT_MESSAGES);
        const embed = luvEmbed(COLORS.soft)
          .setTitle(`${EMOJIS.moon} still here ✦`)
          .setDescription(`*"${msg}"*`)
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'comfort_more', label: 'i need more',   emoji: '🌙', style: ButtonStyle.Secondary },
          { id: 'comfort_done', label: 'i feel better', emoji: '✨', style: ButtonStyle.Success },
        );
        await i.update({ embeds: [embed], components: [row] });
      },

      comfort_done: async (i) => {
        const embed = luvEmbed(COLORS.success)
          .setDescription(`${EMOJIS.sparkle} that's everything. keep going ✦`)
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      // ── Confession ────────────────────────────────────────────────────────
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
        if (!conf)                         return await i.reply({ embeds: [errorEmbed('confession not found')], ephemeral: true });
        if (conf.authorId !== i.user.id)   return await i.reply({ embeds: [errorEmbed('this isn\'t yours to reveal')], ephemeral: true });
        revealConfession(confessionId);
        const embed = luvEmbed(COLORS.rose)
          .setTitle(`${EMOJIS.confession} confession revealed`)
          .setDescription(conf.text)
          .addFields({ name: 'revealed by', value: `**${i.user.username}**` })
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      // ── Daily ──────────────────────────────────────────────────────────────
      daily_claim: async (i) => {
        const result = claimDaily(i.user.id);
        if (!result.success) {
          const embed = luvEmbed(COLORS.neutral)
            .setDescription(`${EMOJIS.moon} already claimed. come back in **${result.waitH}h ${result.waitM}m** ✦`)
            .setFooter(footer(client));
          return await i.reply({ embeds: [embed], ephemeral: true });
        }

        // level-up check
        await checkLevelUp(i.user.id, result.oldXP, result.newXP, i.channel, client);

        // streak achievements
        if (result.streak >= 3)  await unlock(i.user.id, 'streak_3',  client);
        if (result.streak >= 7)  await unlock(i.user.id, 'streak_7',  client);
        if (result.streak >= 30) await unlock(i.user.id, 'streak_30', client);

        const embed = luvEmbed(COLORS.gold)
          .setTitle(`${EMOJIS.streak} daily claimed ✦`)
          .addFields(
            { name: 'xp earned',    value: `**+${result.xp} xp**`,         inline: true },
            { name: 'hearts',       value: `**+${result.hearts} 💗**`,      inline: true },
            { name: 'streak',       value: `**${result.streak} days** 🔥`,  inline: true },
          )
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      // ── Chemistry boost ───────────────────────────────────────────────────
      chem_boost: async (i, [targetId]) => {
        const newScore = addChemistry(i.user.id, targetId, 5);
        const target   = await client.users.fetch(targetId).catch(() => null);
        if (newScore >= 100) await unlock(i.user.id, 'chem_100', client);
        if (newScore >= 200) await unlock(i.user.id, 'chem_200', client);
        const embed = luvEmbed(COLORS.aura)
          .setDescription(`${EMOJIS.chemistry} chemistry with **${target?.username ?? 'them'}** boosted to **${newScore}**/200 ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Midnight ──────────────────────────────────────────────────────────
      midnight_confess: async (i) => {
        const modal = new ModalBuilder().setCustomId('modal_midnight_confess').setTitle('midnight confession ✦');
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId('thought').setLabel('what\'s on your mind right now?')
              .setStyle(TextInputStyle.Paragraph).setMaxLength(300).setRequired(true)
              .setPlaceholder('say the thing you\'ve been keeping inside...')
          ),
        );
        await i.showModal(modal);
      },

      midnight_comfort: async (i) => {
        const msg   = randomFrom(COMFORT_MESSAGES);
        const embed = luvEmbed(COLORS.midnight)
          .setTitle(`${EMOJIS.moon} midnight comfort`)
          .setDescription(`*"${msg}"*`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      midnight_vibe: async (i) => {
        const vibes = [
          'you\'re giving: soft chaos at 2am ✨',
          'vibe: melancholic but make it aesthetic 🌙',
          'energy: someone who thinks too much and feels even more 💫',
          'you\'re giving: quiet storm 🌧️',
          'vibe check: emotionally loaded but holding it together 💜',
        ];
        const embed = luvEmbed(COLORS.purple)
          .setDescription(randomFrom(vibes))
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Shop ──────────────────────────────────────────────────────────────
      shop_open: async (i) => {
        const hearts = getHearts(i.user.id);
        const embed  = luvEmbed(COLORS.gold)
          .setTitle(`${EMOJIS.diamond} luvly shop ✦`)
          .setDescription(`you have **${hearts} 💗 hearts**\nuse **u shop buy <item_id>** to purchase ✦`)
          .setFooter(footer(client));
        for (const cat of [...new Set(Object.values(SHOP_ITEMS).map(it => it.category))]) {
          const items = Object.values(SHOP_ITEMS).filter(it => it.category === cat);
          embed.addFields({
            name: cat,
            value: items.map(it => `${it.emoji} \`${it.id}\` — **${it.name}** · ${it.price} 💗`).join('\n'),
            inline: false,
          });
        }
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Premium notify ────────────────────────────────────────────────────
      premium_interest: async (i) => {
        addHearts(i.user.id, 5);
        const embed = luvEmbed(COLORS.gold)
          .setDescription(`${EMOJIS.diamond} you'll be notified when premium launches. we gave you **+5 💗** for your patience ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },
    },

    // ── SELECTS ──────────────────────────────────────────────────────────────
    selects: {

      help_category: async (i, _parts) => {
        const catArg = i.values[0];
        const CAT_META = {
          social:      { emoji: '❤️',  label: 'social' },
          matchmaking: { emoji: '💌',  label: 'matchmaking' },
          midnight:    { emoji: '🌙',  label: 'midnight' },
          confession:  { emoji: '🎭',  label: 'confession' },
          chemistry:   { emoji: '⚗️',  label: 'chemistry' },
          engagement:  { emoji: '🎮',  label: 'engagement' },
          ai:          { emoji: '🤖',  label: 'ai' },
          safety:      { emoji: '🛡️',  label: 'safety' },
          premium:     { emoji: '💎',  label: 'premium' },
          hidden:      { emoji: '🔥',  label: 'hidden' },
        };
        const cat  = CAT_META[catArg];
        const cmds = [...client.commands.values()].filter(c => c.category === catArg);
        const embed = luvEmbed(COLORS.primary)
          .setTitle(`${cat?.emoji ?? '✦'} ${cat?.label ?? catArg} commands ✦`)
          .setDescription(
            cmds.map(c =>
              `**u ${c.name}**${c.aliases?.length ? ' · ' + c.aliases.map(a => `**u ${a}**`).join(' · ') : ''}\n*${c.description}*  ·  \`${c.usage}\``
            ).join('\n\n') || '*no commands in this category*'
          )
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      shop_preview: async (i, _parts) => {
        const itemId = i.values[0];
        const item   = SHOP_ITEMS[itemId];
        if (!item) return await i.reply({ embeds: [errorEmbed('item not found')], ephemeral: true });
        const hearts = getHearts(i.user.id);
        const canAfford = hearts >= item.price;
        const embed = luvEmbed(canAfford ? COLORS.gold : COLORS.neutral)
          .setTitle(`${item.emoji} ${item.name}`)
          .setDescription(item.desc)
          .addFields(
            { name: 'price',       value: `**${item.price} 💗**`, inline: true },
            { name: 'your hearts', value: `**${hearts} 💗**`,     inline: true },
            { name: 'status',      value: canAfford ? '✅ you can afford this' : '❌ not enough hearts', inline: true },
          )
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
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

        // first profile achievement
        await unlock(i.user.id, 'first_profile', client);

        const embed = luvEmbed(COLORS.primary)
          .setTitle(`${EMOJIS.aura} profile updated ✦`)
          .setDescription('your profile has been saved.')
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      modal_confess: async (i) => {
        const text       = i.fields.getTextInputValue('confession');
        const targetName = i.fields.getTextInputValue('target')?.trim() || null;
        const conf       = addConfession(i.user.id, text, targetName);
        const { oldXP, newXP } = addXP(i.user.id, 15);
        await checkLevelUp(i.user.id, oldXP, newXP, i.channel, client);
        await unlock(i.user.id, 'confessor', client);

        const embed = luvEmbed(COLORS.purple)
          .setTitle(`${EMOJIS.confession} anonymous confession ✦`)
          .setDescription(
            targetName ? `*to ${targetName}:*\n\n*"${text}"*` : `*"${text}"*`
          )
          .setFooter({ text: `confession · id: ${conf.id}` });
        const row = buildButtons(
          { id: `confess_reveal:${conf.id}`, label: 'reveal identity', emoji: '🔓', style: ButtonStyle.Danger },
        );
        await i.reply({ embeds: [embed], components: [row] });
      },

      modal_midnight_confess: async (i) => {
        const thought = i.fields.getTextInputValue('thought');
        const { oldXP, newXP } = addXP(i.user.id, 10);
        await checkLevelUp(i.user.id, oldXP, newXP, i.channel, client);
        const embed = luvEmbed(COLORS.midnight)
          .setTitle(`${EMOJIS.moon} midnight thought ✦`)
          .setDescription(`*"${thought}"*`)
          .addFields({ name: '\u200b', value: `— anonymous soul, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` })
          .setFooter(footer(client));
        await i.reply({ embeds: [embed] });
      },
    },
  };
}
