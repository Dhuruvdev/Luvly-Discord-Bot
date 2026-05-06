import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, RIZZ_LINES } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addXP, getUser, saveUser } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name: 'rizz',
  aliases: ['flirt', 'starter', 'vibecheck'],
  description: 'generate a pickup line or vibe check',
  category: 'ai',
  usage: 'rizz [@user]',
  cooldown: 4_000,

  async execute(message, args, client) {
    const target = message.mentions.users.first();
    const line   = RIZZ_LINES[Math.floor(Math.random() * RIZZ_LINES.length)];

    const { oldXP, newXP } = addXP(message.author.id, 3);
    await checkLevelUp(message.author.id, oldXP, newXP, message.channel, client);

    const user  = getUser(message.author.id);
    const count = (user.rizzCount ?? 0) + 1;
    saveUser(message.author.id, { rizzCount: count });
    if (count >= 25) await unlock(message.author.id, 'rizz_master', client);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.rizz} Rizz Generator ꩜ .**\n\n` +
      (target ? `*sending this to **${target.username}** ✦*\n\n` : '') +
      `> *"${line}"*`;

    const row = buildButtons(
      { id: 'rizz_new',  label: 'new line', emoji: '🔄', style: ButtonStyle.Secondary },
      { id: 'rizz_copy', label: 'use this', emoji: '💌', style: ButtonStyle.Primary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
