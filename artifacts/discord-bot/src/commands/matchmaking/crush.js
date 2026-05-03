import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { setCrush, getCrush, checkMutualCrush } from '../../utils/database.js';

export default {
  name: 'crush',
  aliases: ['c', 'soulmate'],
  description: 'set your secret crush',
  category: 'matchmaking',
  usage: 'crush @user',

  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) {
      const existing = getCrush(message.author.id);
      if (!existing) {
        const embed = luvEmbed(COLORS.rose)
          .setTitle(`${EMOJIS.heart} no crush set yet`)
          .setDescription('use **u crush @user** to set your secret crush.\n\nthey won\'t be notified. it stays between you and the stars ✦')
          .setFooter(footer(client));
        const row = buildButtons(
          { id: 'crush_anonymous', label: 'stay anonymous', emoji: '🔒', style: ButtonStyle.Secondary },
        );
        return await message.reply({ embeds: [embed], components: [row] });
      }

      const crushUser = await client.users.fetch(existing.targetId).catch(() => null);
      const isMutual = checkMutualCrush(message.author.id, existing.targetId);
      const embed = luvEmbed(COLORS.rose)
        .setTitle(`${EMOJIS.heart} your current crush`)
        .addFields(
          { name: 'secret crush', value: isMutual ? `**${crushUser?.username || 'unknown'}** 💞` : `*hidden* 🔒`, inline: true },
          { name: 'mutual?', value: isMutual ? '**yes! 💞**' : 'not yet...', inline: true },
        )
        .setDescription(isMutual ? '🎉 they like you back! check below.' : 'your crush is safe with luvly. they won\'t know unless it\'s mutual ✦')
        .setFooter(footer(client));

      const row = buildButtons(
        { id: `crush_reveal:${existing.targetId}`, label: isMutual ? 'see reveal!' : 'check mutual', emoji: isMutual ? '💞' : '🔓', style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary },
        { id: 'crush_anonymous', label: 'change crush', emoji: '💌', style: ButtonStyle.Primary },
      );
      return await message.reply({ embeds: [embed], components: [row] });
    }

    if (target.id === message.author.id) {
      return await message.reply({ embeds: [errorEmbed('you can\'t crush on yourself... unless? 💀')] });
    }

    if (target.bot) {
      return await message.reply({ embeds: [errorEmbed('bots can\'t love back. trust me. 🤖')] });
    }

    setCrush(message.author.id, target.id);
    const isMutual = checkMutualCrush(message.author.id, target.id);

    const embed = luvEmbed(isMutual ? COLORS.rose : COLORS.purple)
      .setTitle(isMutual ? `${EMOJIS.heart} it's mutual! 💞` : `${EMOJIS.heart} crush set ✦`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(
        isMutual
          ? `you and **${target.username}** both chose each other. the universe heard you ✦`
          : `your feelings for **${target.username}** are safe with luvly.\nthey won't know unless they choose you too ✦`
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: `crush_reveal:${target.id}`, label: isMutual ? 'reveal yourselves!' : 'check if mutual', emoji: '🔓', style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary },
      { id: 'crush_anonymous', label: 'keep secret', emoji: '🔒', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
