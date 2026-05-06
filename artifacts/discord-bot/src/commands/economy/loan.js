import { ButtonStyle, MessageFlags } from 'discord.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import {
  takeLoan, repayLoan, getLoan,
  getWallet, getBank, accrueInterest, getEcoUser, getEconomy, fmt,
} from '../../utils/economy.js';

const R       = '<:right:1501255316350959858>';
const CV2     = MessageFlags.IsComponentsV2;
const MAX_LOAN = 50_000;

export default {
  name: 'loan',
  aliases: ['borrow', 'debt', 'repay', 'lend'],
  description: 'take or repay a loan (compound interest)',
  category: 'economy',
  usage: 'loan <amount> | repay <amount|all>',
  cooldown: 5_000,

  async execute(message, args, client) {
    const sub    = args[0]?.toLowerCase();
    const userId = message.author.id;

    accrueInterest(userId);
    const eco    = getEconomy();
    const loan   = getLoan(userId);
    const wallet = getWallet(userId);

    const loanAPR    = parseFloat((eco.baseInterestRate * 100).toFixed(2));
    const loanAPRAdj = Math.min(30, loanAPR + (eco.inflation - 1) * 20);

    const backRow = buildButtons(
      { id: 'eco_bal',  label: 'my balance', emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_bank', label: 'bank info',  emoji: '', style: ButtonStyle.Secondary },
    );

    if (sub === 'repay' || sub === 'pay') {
      if (loan <= 0)
        return message.reply({ flags: CV2, components: [luvContainer('>  you have no outstanding loan ✦', backRow)] });

      const raw    = args[1];
      const amount = raw === 'all' ? wallet : parseInt(raw ?? '', 10);
      if (!amount || amount < 1)
        return message.reply({ flags: CV2, components: [luvContainer('>  specify amount — `u loan repay all` or `u loan repay 500` ✦', backRow)] });

      const result = repayLoan(userId, amount);
      if (!result.success) {
        if (result.reason === 'no_loan')
          return message.reply({ flags: CV2, components: [luvContainer('>  no loan to repay ✦', backRow)] });
        return message.reply({ flags: CV2, components: [luvContainer(`>  not enough in wallet! you have **${fmt(result.balance)}** ✦`, backRow)] });
      }

      const cleared = result.remaining === 0;
      const text =
        `**﹕ⵌ┆ ${cleared ? ' Loan Cleared!' : ' Partial Repayment'} ꩜ .**\n\n` +
        (cleared
          ? `> *your debt is fully paid off. financial freedom! ✦*`
          : `> *${fmt(result.remaining)} still outstanding — keep repaying to unfreeze your bank*`) +
        `\n\n${R} **Summary:**\n` +
        `> ⤿   Paid: **${fmt(result.paid)}**\n` +
        `> ⤿   Remaining: **${fmt(result.remaining)}**\n` +
        `> ⤿   Wallet: **${fmt(getWallet(userId))}**`;
      const row = buildButtons(
        { id: 'eco_bal',  label: 'balance',   emoji: '', style: ButtonStyle.Primary },
        { id: 'eco_bank', label: 'bank info', emoji: '', style: ButtonStyle.Secondary },
        { id: 'eco_work', label: 'earn more', emoji: '', style: ButtonStyle.Secondary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    if (!sub || isNaN(parseInt(sub))) {
      const text =
        `**﹕ⵌ┆  Luvly Loan Desk ꩜ .**\n\n` +
        (loan > 0
          ? ` you have an **active loan of ${fmt(loan)}**\n> *use \`u loan repay <amount>\` to pay it down*`
          : `> *borrow luv now, repay with interest. compound interest applies daily.*`) +
        `\n\n${R} **Rates:**\n` +
        `> ⤿   Current APR: **${loanAPRAdj.toFixed(1)}%**\n` +
        `> ⤿   Inflation Rate: ×${eco.inflation.toFixed(3)}\n` +
        `> ⤿   Max Loan: **${fmt(MAX_LOAN)}**\n` +
        (loan > 0 ? `> ⤿   Your Debt: **${fmt(loan)}**` : `> ⤿   Status: no active loan`);
      const row = buildButtons(
        loan > 0
          ? { id: 'eco_repay',  label: `repay ${fmt(Math.min(wallet, loan))}`, emoji: '', style: ButtonStyle.Danger }
          : { id: 'eco_borrow', label: 'borrow 1000',                          emoji: '', style: ButtonStyle.Primary },
        { id: 'eco_work', label: 'earn instead', emoji: '', style: ButtonStyle.Secondary },
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
    }

    if (loan > 0)
      return message.reply({ flags: CV2, components: [luvContainer(`>  you already have an active loan of **${fmt(loan)}** — repay it first ✦`, backRow)] });

    const amount = parseInt(sub, 10);
    if (amount < 100)      return message.reply({ flags: CV2, components: [luvContainer('>  minimum loan is 100 luv ✦', backRow)] });
    if (amount > MAX_LOAN) return message.reply({ flags: CV2, components: [luvContainer(`>  max loan is **${fmt(MAX_LOAN)}** ✦`, backRow)] });

    const result = takeLoan(userId, amount);
    if (!result.success)
      return message.reply({ flags: CV2, components: [luvContainer(`>  couldn't process loan — ${result.reason} ✦`, backRow)] });

    const text =
      `**﹕ⵌ┆  Loan Approved ꩜ .**\n\n` +
      `**${fmt(result.amount)}** has been added to your wallet.\n\n` +
      `>  *interest compounds daily at **${result.rate}% APR***\n` +
      `> *if your debt exceeds 2× bank balance, withdrawals freeze*\n\n` +
      `${R} **Loan Details:**\n` +
      `> ⤿   Borrowed: **${fmt(result.amount)}**\n` +
      `> ⤿   APR: **${result.rate}%**\n` +
      `> ⤿   Wallet Now: **${fmt(getWallet(userId))}**`;
    const row = buildButtons(
      { id: 'eco_bank',  label: 'bank it',   emoji: '', style: ButtonStyle.Primary },
      { id: 'eco_work',  label: 'work',      emoji: '', style: ButtonStyle.Secondary },
      { id: 'eco_repay', label: 'repay now', emoji: '', style: ButtonStyle.Danger },
    );
    return message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
