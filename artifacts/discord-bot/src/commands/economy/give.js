import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { transfer, getWallet, fmt } from '../../utils/economy.js';
import { addXP } from '../../utils/database.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'give',
  aliases: ['pay', 'send', 'transfer'],
  description: 'send luv to someone',
  category: 'economy',
  usage: 'give @user <amount>',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first();
    const errRow = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_work', label: 'earn more',  emoji: '', style: ButtonStyle.Secondary },
    );

    if (!target)
      return message.reply({ flags: CV2, components: [luvContainer('>  mention someone to send luv to ✦', errRow)] });
    if (target.id === message.author.id)
      return message.reply({ flags: CV2, components: [luvContainer(">  you can't send luv to yourself ", errRow)] });

    const rawAmt = args.find(a => /^\d+$/.test(a));
    const amount = rawAmt === 'all'
      ? getWallet(message.author.id)
      : parseInt(rawAmt ?? '', 10);

    if (!amount || amount < 1)
      return message.reply({ flags: CV2, components: [luvContainer('>  specify a valid amount — `u give @user 100` ✦', errRow)] });
    if (amount > 1_000_000)
      return message.reply({ flags: CV2, components: [luvContainer('>  max single transfer is 1,000,000 luv ✦', errRow)] });

    const result = transfer(message.author.id, target.id, amount);
    if (!result.success)
      return message.reply({ flags: CV2, components: [luvContainer(`>  not enough in wallet! you have **${fmt(result.balance)}** ✦`, errRow)] });

    addXP(message.author.id, 2);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.heart} Luv Sent ꩜ .**\n\n` +
      `you sent **${fmt(result.amount)}** to **${target.username}** \n\n` +
      `${R} **Transfer:**\n` +
      `> ⤿   Your Wallet: **${fmt(getWallet(message.author.id))}**\n` +
      `> ⤿   They Received: **${fmt(result.amount)}**`;

    const row = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_work', label: 'earn more',  emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
