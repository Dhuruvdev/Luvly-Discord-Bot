import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getChemistry, addChemistry, getTopAdmirer, addXP, isBlocked } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';

function chemLabel(score) {
  if (score >= 200) return 'inseparable 💞';
  if (score >= 100) return 'deeply bonded 🔥';
  if (score >= 50)  return 'connected ⚗️';
  if (score >= 20)  return 'building something ✨';
  if (score >= 5)   return 'just started 🌱';
  return 'strangers... for now 👀';
}

function chemBar(score) {
  const filled = Math.min(Math.round((score / 200) * 20), 20);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
}

export default {
  name: 'chemistry',
  aliases: ['chem', 'admirer', 'duo'],
  description: 'check chemistry with someone',
  category: 'chemistry',
  usage: 'chemistry @user',
  cooldown: 8_000,

  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) {
      const top = getTopAdmirer(message.author.id);
      if (!top.userId) {
        const embed = luvEmbed(COLORS.aura)
          .setTitle(`${EMOJIS.chemistry} chemistry radar`)
          .setDescription('> *no data yet. use **u chem @user** to track a connection ✦*')
          .setFooter(footer(client));
        return await message.reply({ embeds: [embed] });
      }
      const topUser = await client.users.fetch(top.userId).catch(() => null);
      const embed = luvEmbed(COLORS.aura)
        .setTitle(`${EMOJIS.chemistry} your top connection`)
        .addFields(
          { name: 'highest chemistry with', value: `**${topUser?.username ?? 'unknown'}**`, inline: true },
          { name: 'score',                  value: `**${top.score}**/200`,                  inline: true },
          { name: 'connection type',        value: chemLabel(top.score) },
          { name: 'meter',                  value: `\`${chemBar(top.score)}\`` },
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    if (target.id === message.author.id) return await message.reply({ embeds: [errorEmbed('self-chemistry? only you can decide that one 💀')] });
    if (target.bot)                       return await message.reply({ embeds: [errorEmbed("you can't have chemistry with a bot 🤖")] });
    if (isBlocked(message.author.id, target.id)) return await message.reply({ embeds: [errorEmbed("you can't interact with this user ✦")] });

    addChemistry(message.author.id, target.id, 1);
    const { oldXP, newXP } = addXP(message.author.id, 10);
    await checkLevelUp(message.author.id, oldXP, newXP, message.channel, client);

    const score = getChemistry(message.author.id, target.id);
    if (score >= 50)  await unlock(message.author.id, 'chem_50',  client);
    if (score >= 100) await unlock(message.author.id, 'chem_100', client);
    if (score >= 200) await unlock(message.author.id, 'chem_200', client);

    const embed = luvEmbed(COLORS.aura)
      .setAuthor({ name: `${message.author.username} × ${target.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setTitle(`${EMOJIS.chemistry} chemistry check ✦`)
      .addFields(
        { name: 'connection', value: `**${chemLabel(score)}**` },
        { name: 'meter',      value: `\`${chemBar(score)}\`  **${score}**/200` },
        {
          name:  'insight',
          value: score < 20
            ? '> *keep interacting to build your chemistry ✦*'
            : '> *you two have something real ✦*',
        },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: `chem_boost:${target.id}`, label: 'boost chemistry', emoji: '⚗️', style: ButtonStyle.Primary },
    );
    await message.reply({ embeds: [embed], components: [row] });
  },
};
