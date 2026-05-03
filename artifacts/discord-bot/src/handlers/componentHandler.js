import {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { COLORS, EMOJIS, RIZZ_LINES, COMFORT_MESSAGES, getLevelData, getXpBar } from '../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../utils/embeds.js';
import {
  getUser, saveUser, addXP, setCrush, getCrush, checkMutualCrush,
  getChemistry, addChemistry, revealConfession, getConfession,
  claimDaily, addConfession,
} from '../utils/database.js';

export function buildHandlers(client) {
  return {
    buttons: {
      // ── Profile ────────────────────────────────────────────────────────────
      profile_edit: async (i) => {
        const modal = new ModalBuilder()
          .setCustomId('modal_edit_profile')
          .setTitle('edit your profile ✦');
        const bio = new TextInputBuilder()
          .setCustomId('bio')
          .setLabel('bio  (max 120 chars)')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(120)
          .setRequired(false)
          .setPlaceholder('something soft about you...');
        const pronouns = new TextInputBuilder()
          .setCustomId('pronouns')
          .setLabel('pronouns')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(30)
          .setRequired(false)
          .setPlaceholder('she/her · he/him · they/them · etc');
        const interests = new TextInputBuilder()
          .setCustomId('interests')
          .setLabel('interests  (comma separated)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setRequired(false)
          .setPlaceholder('music, art, late nights, stargazing...');
        modal.addComponents(
          new ActionRowBuilder().addComponents(bio),
          new ActionRowBuilder().addComponents(pronouns),
          new ActionRowBuilder().addComponents(interests),
        );
        await i.showModal(modal);
      },

      profile_aura: async (i) => {
        const auras = ['soft', 'ethereal', 'magnetic', 'chaotic', 'midnight', 'golden'];
        const user = getUser(i.user.id);
        const current = user.aura || 'soft';
        const next = auras[(auras.indexOf(current) + 1) % auras.length];
        saveUser(i.user.id, { aura: next });
        const auraColors = {
          soft: COLORS.soft, ethereal: COLORS.purple, magnetic: COLORS.primary,
          chaotic: COLORS.rose, midnight: COLORS.midnight, golden: COLORS.gold,
        };
        const embed = luvEmbed(auraColors[next])
          .setTitle(`${EMOJIS.aura} aura updated`)
          .setDescription(`your aura is now **${next}** ✦`)
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      // ── Match ──────────────────────────────────────────────────────────────
      match_again: async (i) => {
        const users = ['mysterious stranger', 'night owl', 'soft soul', 'chaotic dreamer', 'golden mind'];
        const pick = users[Math.floor(Math.random() * users.length)];
        const compat = 60 + Math.floor(Math.random() * 40);
        const hearts = Math.round(compat / 10);
        const heartBar = '❤️'.repeat(hearts) + '🤍'.repeat(10 - hearts);
        const embed = luvEmbed(COLORS.primary)
          .setTitle(`${EMOJIS.match} new match found`)
          .addFields(
            { name: 'matched with', value: `**${pick}**`, inline: true },
            { name: 'compatibility', value: `**${compat}%**`, inline: true },
            { name: '\u200b', value: heartBar },
          )
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'match_again', label: 'another match', emoji: '🔄', style: ButtonStyle.Secondary },
          { id: 'match_crush', label: 'set as crush', emoji: '💌', style: ButtonStyle.Primary },
        );
        await i.update({ embeds: [embed], components: [row] });
      },

      match_crush: async (i) => {
        const embed = luvEmbed(COLORS.rose)
          .setDescription(`${EMOJIS.heart} to set a real crush, use  **u crush @user** ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Crush ──────────────────────────────────────────────────────────────
      crush_reveal: async (i, [targetId]) => {
        const mutual = checkMutualCrush(i.user.id, targetId);
        if (!mutual) {
          const embed = luvEmbed(COLORS.midnight)
            .setTitle('🔒 not yet...')
            .setDescription(`they haven't set their crush yet.\nif they choose **you** too, you'll both be revealed ✦`)
            .setFooter(footer(client));
          return await i.reply({ embeds: [embed], ephemeral: true });
        }
        const target = await client.users.fetch(targetId).catch(() => null);
        const embed = luvEmbed(COLORS.rose)
          .setTitle(`${EMOJIS.heart} it's mutual 💞`)
          .setDescription(`you and **${target?.username || 'them'}** both have a crush on each other.\n\nyou have each other's hearts. don't waste it ✦`)
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      crush_anonymous: async (i) => {
        const embed = luvEmbed(COLORS.purple)
          .setDescription(`${EMOJIS.confession} your crush is set anonymously. they'll never know unless it's mutual ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Rizz ──────────────────────────────────────────────────────────────
      rizz_new: async (i) => {
        const line = RIZZ_LINES[Math.floor(Math.random() * RIZZ_LINES.length)];
        const embed = luvEmbed(COLORS.aura)
          .setTitle(`${EMOJIS.rizz} fresh line ✦`)
          .setDescription(`*"${line}"*`)
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'rizz_new', label: 'new line', emoji: '🔄', style: ButtonStyle.Secondary },
          { id: 'rizz_copy', label: 'use this one', emoji: '💌', style: ButtonStyle.Primary },
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
        const msg = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];
        const embed = luvEmbed(COLORS.soft)
          .setTitle(`${EMOJIS.moon} still here ✦`)
          .setDescription(`*"${msg}"*`)
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'comfort_more', label: 'i need more', emoji: '🌙', style: ButtonStyle.Secondary },
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
        const modal = new ModalBuilder()
          .setCustomId('modal_confess')
          .setTitle('anonymous confession ✦');
        const text = new TextInputBuilder()
          .setCustomId('confession')
          .setLabel('what do you need to say?')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(true)
          .setPlaceholder('say it here. nobody will know it was you...');
        const target = new TextInputBuilder()
          .setCustomId('target')
          .setLabel('for someone specific? (username or leave blank)')
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder('optional — leave empty for general confession');
        modal.addComponents(
          new ActionRowBuilder().addComponents(text),
          new ActionRowBuilder().addComponents(target),
        );
        await i.showModal(modal);
      },

      confess_reveal: async (i, [confessionId]) => {
        const conf = getConfession(confessionId);
        if (!conf) return await i.reply({ embeds: [errorEmbed('confession not found')], ephemeral: true });
        if (conf.authorId !== i.user.id) return await i.reply({ embeds: [errorEmbed('this isn\'t yours to reveal')], ephemeral: true });
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
            .setDescription(`${EMOJIS.moon} already claimed today. come back in **${result.waitH}h ${result.waitM}m** ✦`)
            .setFooter(footer(client));
          return await i.reply({ embeds: [embed], ephemeral: true });
        }
        const embed = luvEmbed(COLORS.gold)
          .setTitle(`${EMOJIS.streak} daily claimed ✦`)
          .addFields(
            { name: 'xp earned', value: `**+${result.xp} xp**`, inline: true },
            { name: 'streak', value: `**${result.streak} days** 🔥`, inline: true },
          )
          .setFooter(footer(client));
        await i.update({ embeds: [embed], components: [] });
      },

      // ── Chemistry ─────────────────────────────────────────────────────────
      chem_boost: async (i, [targetId]) => {
        const newScore = addChemistry(i.user.id, targetId, 5);
        const target = await client.users.fetch(targetId).catch(() => null);
        const embed = luvEmbed(COLORS.aura)
          .setDescription(`${EMOJIS.chemistry} chemistry with **${target?.username || 'them'}** boosted to **${newScore}** ✦`)
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      // ── Midnight ──────────────────────────────────────────────────────────
      midnight_confess: async (i) => {
        const modal = new ModalBuilder()
          .setCustomId('modal_midnight_confess')
          .setTitle('midnight confession ✦');
        const text = new TextInputBuilder()
          .setCustomId('thought')
          .setLabel('what\'s on your mind right now?')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(300)
          .setRequired(true)
          .setPlaceholder('say the thing you\'ve been keeping inside...');
        modal.addComponents(new ActionRowBuilder().addComponents(text));
        await i.showModal(modal);
      },

      midnight_comfort: async (i) => {
        const msg = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];
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
          .setDescription(vibes[Math.floor(Math.random() * vibes.length)])
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },
    },

    selects: {
      help_category: async (i, _parts, client) => {
        const catArg = i.values[0];
        const CATEGORIES = {
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
        const cat = CATEGORIES[catArg];
        const cmds = [...client.commands.values()].filter(c => c.category === catArg);
        const embed = luvEmbed(COLORS.primary)
          .setTitle(`${cat.emoji} ${cat.label} commands ✦`)
          .setDescription(
            cmds.map(c =>
              `**u ${c.name}** ${c.aliases?.map(a => `· **u ${a}**`).join(' ') || ''}\n*${c.description}*  ·  \`${c.usage}\``
            ).join('\n\n') || '*no commands found*'
          )
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },
    },

    modals: {
      modal_edit_profile: async (i) => {
        const bio = i.fields.getTextInputValue('bio') || null;
        const pronouns = i.fields.getTextInputValue('pronouns') || null;
        const interestsRaw = i.fields.getTextInputValue('interests') || '';
        const interests = interestsRaw ? interestsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
        saveUser(i.user.id, { bio, pronouns, interests });
        const embed = luvEmbed(COLORS.primary)
          .setTitle(`${EMOJIS.aura} profile updated ✦`)
          .setDescription('your profile has been saved.')
          .setFooter(footer(client));
        await i.reply({ embeds: [embed], ephemeral: true });
      },

      modal_confess: async (i) => {
        const text = i.fields.getTextInputValue('confession');
        const targetRaw = i.fields.getTextInputValue('target') || null;
        const conf = addConfession(i.user.id, text, targetRaw);
        addXP(i.user.id, 15);
        const embed = luvEmbed(COLORS.purple)
          .setTitle(`${EMOJIS.confession} anonymous confession ✦`)
          .setDescription(`*"${text}"*`)
          .setFooter({ text: `confession · id: ${conf.id}` });
        const row = buildButtons(
          { id: `confess_reveal:${conf.id}`, label: 'reveal identity', emoji: '🔓', style: ButtonStyle.Danger },
        );
        await i.reply({ embeds: [embed], components: [row] });
      },

      modal_midnight_confess: async (i) => {
        const thought = i.fields.getTextInputValue('thought');
        addXP(i.user.id, 10);
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
