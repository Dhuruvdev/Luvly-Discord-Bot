import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { setCrush, getCrush, checkMutualCrush, isBlocked, addXP } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';

export default {
  name: 'crush',
  aliases: ['c', 'soulmate'],
  description: 'set your secret crush',
  category: 'matchmaking',
  usage: 'crush @user',
  cooldown: 5_000,

  data: new SlashCommandBuilder()
    .setName('crush')
    .setDescription('Set your secret crush or check your current one')
    .addUserOption(o =>
      o.setName('user').setDescription('User to set as your crush (leave empty to check your current crush)')
    ),

  async execute(message, args, client) {
    const target = message.mentions.users.first();

    if (!target) {
      const existing = getCrush(message.author.id);
      if (!existing) {
        const embed = luvEmbed(COLORS.rose)
          .setTitle(`${EMOJIS.heart} no crush set yet`)
          .setDescription(
            "use **u crush @user** to set your secret crush.\n" +
            "> *they won't be notified — it stays between you and the stars ✦*"
          )
          .setFooter(footer(client));
        return await message.reply({ embeds: [embed] });
      }
      const crushUser = await client.users.fetch(existing.targetId).catch(() => null);
      const isMutual  = checkMutualCrush(message.author.id, existing.targetId);
      const embed = luvEmbed(COLORS.rose)
        .setTitle(`${EMOJIS.heart} your current crush`)
        .setDescription(isMutual ? '🎉 they like you back!' : '> *your crush is safe with luvly ✦*')
        .addFields(
          { name: 'crush',   value: isMutual ? `**${crushUser?.username ?? 'unknown'}** 💞` : '*hidden* 🔒', inline: true },
          { name: 'mutual?', value: isMutual ? '**yes! 💞**' : 'not yet...', inline: true },
        )
        .setFooter(footer(client));
      const row = buildButtons(
        {
          id:    `crush_reveal:${existing.targetId}`,
          label: isMutual ? 'reveal!' : 'check mutual',
          emoji: isMutual ? '💞' : '🔓',
          style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary,
        },
      );
      return await message.reply({ embeds: [embed], components: [row] });
    }

    if (target.id === message.author.id) return await message.reply({ embeds: [errorEmbed("you can't crush on yourself... unless? 💀")] });
    if (target.bot)                       return await message.reply({ embeds: [errorEmbed("bots can't love back. trust me 🤖")] });
    if (isBlocked(message.author.id, target.id)) return await message.reply({ embeds: [errorEmbed("you can't interact with this user ✦")] });

    const isFirstCrush = !getCrush(message.author.id);
    setCrush(message.author.id, target.id);

    if (isFirstCrush) await unlock(message.author.id, 'first_crush', client);

    const isMutual = checkMutualCrush(message.author.id, target.id);
    if (isMutual) {
      await unlock(message.author.id, 'mutual_crush', client);
      await unlock(target.id,         'mutual_crush', client);
      try {
        const dmEmbed = luvEmbed(COLORS.rose)
          .setTitle('💞 someone likes you back!')
          .setDescription(`you and **${message.author.username}** both chose each other.\n> *the universe heard you ✦*`)
          .setFooter({ text: 'luvly ✦' });
        const tUser = await client.users.fetch(target.id);
        await tUser.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch {}
    }

    const embed = luvEmbed(isMutual ? COLORS.rose : COLORS.purple)
      .setTitle(isMutual ? `${EMOJIS.heart} it's mutual! 💞` : `${EMOJIS.heart} crush set ✦`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(
        isMutual
          ? `you and **${target.username}** both chose each other ✦`
          : `your feelings for **${target.username}** are safe.\n> *they won't know unless they choose you too ✦*`
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: `crush_reveal:${target.id}`, label: isMutual ? 'reveal!' : 'check mutual', emoji: '🔓', style: isMutual ? ButtonStyle.Success : ButtonStyle.Secondary },
      { id: 'crush_anonymous', label: 'keep secret', emoji: '🔒', style: ButtonStyle.Secondary },
    );
    await message.reply({ embeds: [embed], components: [row] });
  },
};
