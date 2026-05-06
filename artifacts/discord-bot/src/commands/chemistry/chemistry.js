import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { getChemistry, addChemistry, getTopAdmirer, addXP, isBlocked } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

function chemLabel(score) {
  if (score >= 200) return 'inseparable ';
  if (score >= 100) return 'deeply bonded ';
  if (score >= 50)  return 'connected ';
  if (score >= 20)  return 'building something ';
  if (score >= 5)   return 'just started ';
  return 'strangers... for now ';
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
        const text =
          `**﹕ⵌ┆ ${EMOJIS.chemistry} Chemistry Radar ꩜ .**\n\n` +
          `> *no data yet. use **u chem @user** to track a connection ✦*`;
        const noDataRow = buildButtons(
          { id: 'match_again', label: 'find a match', emoji: '', style: ButtonStyle.Primary },
        );
        return await message.reply({ flags: CV2, components: [luvContainer(text, noDataRow)] });
      }
      const topUser = await client.users.fetch(top.userId).catch(() => null);
      const text =
        `**﹕ⵌ┆ ${EMOJIS.chemistry} Top Connection ꩜ .**\n\n` +
        `${R} **Your Highest Chemistry:**\n` +
        `> ⤿  User: **${topUser?.username ?? 'unknown'}**\n` +
        `> ⤿  Score: **${top.score}**/200\n` +
        `> ⤿  Connection: ${chemLabel(top.score)}\n` +
        `> ⤿  Meter: \`${chemBar(top.score)}\``;
      const topRow = buildButtons(
        { id: `chem_boost:${top.userId}`, label: 'boost chemistry', emoji: '', style: ButtonStyle.Primary },
        { id: 'daily_claim',              label: 'claim daily',     emoji: '', style: ButtonStyle.Secondary },
      );
      return await message.reply({ flags: CV2, components: [luvContainer(text, topRow)] });
    }

    if (target.id === message.author.id)
      return await message.reply({ flags: CV2, components: [luvContainer('>  self-chemistry? only you can decide that one ')] });
    if (target.bot)
      return await message.reply({ flags: CV2, components: [luvContainer(">  you can't have chemistry with a bot ")] });
    if (isBlocked(message.author.id, target.id))
      return await message.reply({ flags: CV2, components: [luvContainer(">  you can't interact with this user ✦")] });

    addChemistry(message.author.id, target.id, 1);
    const { oldXP, newXP } = addXP(message.author.id, 10);
    await checkLevelUp(message.author.id, oldXP, newXP, message.channel, client);

    const score = getChemistry(message.author.id, target.id);
    if (score >= 50)  await unlock(message.author.id, 'chem_50',  client);
    if (score >= 100) await unlock(message.author.id, 'chem_100', client);
    if (score >= 200) await unlock(message.author.id, 'chem_200', client);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.chemistry} Chemistry Check ꩜ .**\n\n` +
      `${message.author.username} × ${target.username}\n\n` +
      `${R} **Connection:**\n` +
      `> ⤿  ${chemLabel(score)}\n` +
      `> ⤿  Meter: \`${chemBar(score)}\`  **${score}**/200\n\n` +
      `${R} **Insight:**\n` +
      (score < 20 ? '> *keep interacting to build your chemistry ✦*' : '> *you two have something real ✦*');

    const row = buildButtons(
      { id: `chem_boost:${target.id}`, label: 'boost chemistry', emoji: '', style: ButtonStyle.Primary },
    );
    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
