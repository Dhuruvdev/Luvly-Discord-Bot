import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { rob, getWallet, getEcoUser, fmt } from '../../utils/economy.js';
import { isBlocked } from '../../utils/database.js';

const COOLDOWN_MS = 60 * 60 * 1_000; // 1hr

const SUCCESS_LINES = [
  'you slipped through the shadows undetected',
  'five-finger discount applied successfully',
  'they never saw it coming',
  'smooth criminal behaviour',
  "the universe redistributed some wealth",
];

const CAUGHT_LINES = [
  'you tripped over their cat on the way out',
  'they heard you coming from a mile away',
  'a nearby pigeon sold you out',
  'you forgot to turn off your notification sounds',
  'karma said absolutely not',
];

export default {
  name: 'rob',
  aliases: ['steal', 'mug'],
  description: 'rob someone\'s wallet (risky!)',
  category: 'economy',
  usage: 'rob @user',
  cooldown: 0,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first();
    const baseRow = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '👛', style: ButtonStyle.Primary },
      { id: 'eco_work', label: 'work for it', emoji: '💼', style: ButtonStyle.Secondary },
    );

    if (!target) {
      return message.reply({ embeds: [errorEmbed('mention someone to rob ✦')], components: [baseRow] });
    }
    if (target.id === message.author.id) {
      return message.reply({ embeds: [errorEmbed("you can't rob yourself 💀")], components: [baseRow] });
    }
    if (isBlocked(message.author.id, target.id)) {
      return message.reply({ embeds: [errorEmbed("you can't interact with this user ✦")], components: [baseRow] });
    }

    const u   = getEcoUser(message.author.id);
    const now = Date.now();
    if ((now - (u.lastRob ?? 0)) < COOLDOWN_MS) {
      const left = COOLDOWN_MS - (now - (u.lastRob ?? 0));
      const embed = luvEmbed(COLORS.neutral)
        .setTitle(`${EMOJIS.ghost} lay low ✦`)
        .setDescription(`police are still looking for you.\n\n⏳ try again in **${Math.ceil(left / 60_000)} min**`)
        .setFooter(footer(client));
      return message.reply({ embeds: [embed], components: [baseRow] });
    }

    const victimWallet = getWallet(target.id);
    if (victimWallet < 50) {
      const embed = luvEmbed(COLORS.neutral)
        .setTitle(`${EMOJIS.ghost} not worth it ✦`)
        .setDescription(`**${target.username}** only has **${fmt(victimWallet)}** in their wallet.\n> *not worth the risk — they're broker than you ✦*`)
        .setFooter(footer(client));
      return message.reply({ embeds: [embed], components: [baseRow] });
    }

    const result = rob(message.author.id, target.id);

    if (result.success) {
      const line  = SUCCESS_LINES[Math.floor(Math.random() * SUCCESS_LINES.length)];
      const embed = luvEmbed(COLORS.purple)
        .setTitle(`${EMOJIS.ghost} successful robbery ✦`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setDescription(`*${line}*`)
        .addFields(
          { name: '💸 stolen from',   value: `**${target.username}**`,            inline: true },
          { name: '💰 haul',          value: `**${fmt(result.stolen)}**`,          inline: true },
          { name: '👛 your wallet',   value: `**${fmt(getWallet(message.author.id))}**`, inline: true },
        )
        .setFooter(footer(client));
      const row = buildButtons(
        { id: 'eco_deposit', label: 'stash it',   emoji: '🏦', style: ButtonStyle.Primary },
        { id: 'eco_bal',     label: 'balance',    emoji: '👛', style: ButtonStyle.Secondary },
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    if (result.reason === 'caught') {
      const line  = CAUGHT_LINES[Math.floor(Math.random() * CAUGHT_LINES.length)];
      const embed = luvEmbed(COLORS.rose)
        .setTitle('🚨 caught! ✦')
        .setDescription(`*${line}*\n\n> you paid **${fmt(result.fine)}** in fines`)
        .addFields(
          { name: '💸 fine paid',   value: `**${fmt(result.fine)}**`,          inline: true },
          { name: '👛 wallet',      value: `**${fmt(getWallet(message.author.id))}**`, inline: true },
        )
        .setFooter(footer(client));
      const row = buildButtons(
        { id: 'eco_work', label: 'earn it back', emoji: '💼', style: ButtonStyle.Primary },
        { id: 'eco_bal',  label: 'balance',      emoji: '👛', style: ButtonStyle.Secondary },
      );
      return message.reply({ embeds: [embed], components: [row] });
    }
  },
};
