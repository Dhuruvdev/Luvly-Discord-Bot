import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getChemistry, addChemistry, getTopAdmirer, addXP } from '../../utils/database.js';

function chemLabel(score) {
  if (score >= 200) return 'soulmates 💞';
  if (score >= 100) return 'obsessed 🔥';
  if (score >= 50)  return 'deeply connected ⚗️';
  if (score >= 20)  return 'building something ✨';
  if (score >= 5)   return 'just started 🌱';
  return 'strangers... for now 👀';
}

function chemBar(score) {
  const max = 200;
  const filled = Math.min(Math.round((score / max) * 20), 20);
  return `${'█'.repeat(filled)}${'░'.repeat(20 - filled)}`;
}

export default {
  name: 'chemistry',
  aliases: ['chem', 'streak', 'admirer', 'duo'],
  description: 'check your chemistry with someone',
  category: 'chemistry',
  usage: 'chemistry @user',

  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) {
      const top = getTopAdmirer(message.author.id);
      if (!top.userId) {
        const embed = luvEmbed(COLORS.aura)
          .setTitle(`${EMOJIS.chemistry} chemistry radar`)
          .setDescription('no chemistry data yet.\nstart talking to people and use **u chem @user** to track your connection ✦')
          .setFooter(footer(client));
        return await message.reply({ embeds: [embed] });
      }
      const topUser = await client.users.fetch(top.userId).catch(() => null);
      const embed = luvEmbed(COLORS.aura)
        .setTitle(`${EMOJIS.chemistry} your top connection`)
        .addFields(
          { name: 'highest chemistry with', value: `**${topUser?.username || 'unknown'}**`, inline: true },
          { name: 'score', value: `**${top.score}**`, inline: true },
          { name: 'connection type', value: chemLabel(top.score) },
          { name: 'chemistry meter', value: `\`${chemBar(top.score)}\`  ${top.score}/200` },
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) {
      return await message.reply({ embeds: [errorEmbed('self-chemistry? you\'re one of a kind 💀')] });
    }

    addChemistry(message.author.id, target.id, 1);
    addXP(message.author.id, 10);

    const score = getChemistry(message.author.id, target.id);
    const label = chemLabel(score);
    const bar = chemBar(score);

    const embed = luvEmbed(COLORS.aura)
      .setAuthor({ name: `${message.author.username} × ${target.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTitle(`${EMOJIS.chemistry} chemistry check ✦`)
      .addFields(
        { name: 'connection type', value: `**${label}**` },
        { name: 'chemistry score', value: `\`${bar}\`  **${score}**/200` },
        { name: 'tip', value: score < 20 ? 'keep interacting to build your chemistry ✦' : 'you two have something real ✦' },
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter(footer(client));

    const row = buildButtons(
      { id: `chem_boost:${target.id}`, label: 'boost chemistry', emoji: '⚗️', style: ButtonStyle.Primary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
