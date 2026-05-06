import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { setCrush, getCrush, checkMutualCrush, isBlocked, addXP } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'crush',
  aliases: ['c', 'soulmate'],
  description: 'set your secret crush',
  category: 'matchmaking',
  usage: 'crush @user',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) {
      const existing = getCrush(message.author.id);
      if (!existing) {
        const text =
          `**﹕ⵌ┆ ${EMOJIS.heart} No Crush Set Yet ꩜ .**\n\n` +
          `use **u crush @user** to set your secret crush.\n\n` +
          `> *they won't be notified — it stays between you and the stars ✦*`;
        const noRow = buildButtons(
          { id: 'match_again', label: 'find a match', emoji: '💌', style: ButtonStyle.Primary },
        );
        return await message.reply({ flags: CV2, components: [luvContainer(text, noRow)] });
      }
      const crushUser = await client.users.fetch(existing.targetId).catch(() => null);
      const isMutual  = checkMutualCrush(message.author.id, existing.targetId);
      const text =
        `**﹕ⵌ┆ ${EMOJIS.heart} Your Current Crush ꩜ .**\n\n` +
        `${isMutual ? '🎉 they like you back!' : '> *your crush is safe with luvly ✦*'}\n\n` +
        `${R} **Status:**\n` +
        `> ⤿  Crush: ${isMutual ? `**${crushUser?.username ?? 'unknown'}** 💞` : '*hidden* 🔒'}\n` +
        `> ⤿  Mutual: ${isMutual ? '**yes! 💞**' : 'not yet...'}`;
      const row = buildButtons({
        id:    `crush_reveal:${existing.targetId}`,
        label: isMutual ? 'reveal!' : 'check mutual',
        emoji: isMutual ? '💞' : '🔓',
        style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary,
      });
      return await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    if (target.id === message.author.id)
      return await message.reply({ flags: CV2, components: [luvContainer("> ⚠️ you can't crush on yourself... unless? 💀")] });
    if (target.bot)
      return await message.reply({ flags: CV2, components: [luvContainer("> ⚠️ bots can't love back. trust me 🤖")] });
    if (isBlocked(message.author.id, target.id))
      return await message.reply({ flags: CV2, components: [luvContainer("> ⚠️ you can't interact with this user ✦")] });

    const isFirstCrush = !getCrush(message.author.id);
    setCrush(message.author.id, target.id);

    if (isFirstCrush) await unlock(message.author.id, 'first_crush', client);

    const isMutual = checkMutualCrush(message.author.id, target.id);
    if (isMutual) {
      await unlock(message.author.id, 'mutual_crush', client);
      await unlock(target.id,         'mutual_crush', client);
      try {
        const tUser = await client.users.fetch(target.id);
        await tUser.send({
          flags: CV2,
          components: [luvContainer(
            `**﹕ⵌ┆ 💞 Someone Likes You Back! ꩜ .**\n\n` +
            `you and **${message.author.username}** both chose each other.\n\n` +
            `> *the universe heard you ✦*`
          )],
        }).catch(() => {});
      } catch {}
    }

    const text = isMutual
      ? `**﹕ⵌ┆ ${EMOJIS.heart} It's Mutual! 💞 ꩜ .**\n\nyou and **${target.username}** both chose each other ✦`
      : `**﹕ⵌ┆ ${EMOJIS.heart} Crush Set ꩜ .**\n\nyour feelings for **${target.username}** are safe.\n> *they won't know unless they choose you too ✦*`;

    const row = buildButtons(
      { id: `crush_reveal:${target.id}`, label: isMutual ? 'reveal!' : 'check mutual', emoji: '🔓', style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary },
      { id: 'crush_anonymous', label: 'keep secret', emoji: '🔒', style: ButtonStyle.Secondary },
    );
    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
