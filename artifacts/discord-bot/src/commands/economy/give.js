import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { transfer, getWallet, fmt } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';

export default {
  name: 'give',
  aliases: ['pay', 'send', 'transfer'],
  description: 'send luv to someone',
  category: 'economy',
  usage: 'give @user <amount>',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first();
    const row    = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '👛', style: ButtonStyle.Primary },
      { id: 'eco_work', label: 'earn more',  emoji: '💼', style: ButtonStyle.Secondary },
    );

    if (!target) {
      return message.reply({ embeds: [errorEmbed('mention someone to send luv to ✦')], components: [row] });
    }
    if (target.id === message.author.id) {
      return message.reply({ embeds: [errorEmbed("you can't send luv to yourself 💀")], components: [row] });
    }

    const rawAmt = args.find(a => /^\d+$/.test(a));
    const amount = rawAmt === 'all'
      ? getWallet(message.author.id)
      : parseInt(rawAmt ?? '', 10);

    if (!amount || amount < 1) {
      return message.reply({ embeds: [errorEmbed('specify a valid amount — `u give @user 100` ✦')], components: [row] });
    }
    if (amount > 1_000_000) {
      return message.reply({ embeds: [errorEmbed('max single transfer is 1,000,000 luv ✦')], components: [row] });
    }

    const result = transfer(message.author.id, target.id, amount);
    if (!result.success) {
      return message.reply({
        embeds: [errorEmbed(`not enough in wallet! you have **${fmt(result.balance)}** ✦`)],
        components: [row],
      });
    }

    addXP(message.author.id, 2);

    const embed = luvEmbed(COLORS.success)
      .setTitle(`${EMOJIS.heart} luv sent ✦`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setDescription(`you sent **${fmt(result.amount)}** to **${target.username}** 💌`)
      .addFields(
        { name: '👛 your wallet', value: `**${fmt(getWallet(message.author.id))}**`, inline: true },
        { name: "💸 they received", value: `**${fmt(result.amount)}**`,              inline: true },
      )
      .setFooter(footer(client));

    const successRow = buildButtons(
      { id: 'eco_bal',  label: 'my balance',  emoji: '👛', style: ButtonStyle.Primary },
      { id: 'eco_work', label: 'earn more',   emoji: '💼', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [successRow] });
  },
};
