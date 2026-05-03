import { AttachmentBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, getLevelData } from '../../config.js';
import { luvEmbed, buildButtons, errorEmbed, footer } from '../../utils/embeds.js';
import { getUser, getHearts, getUserTheme } from '../../utils/database.js';
import { generateCard } from '../../utils/cardGenerator.js';

export default {
  name: 'card',
  aliases: ['profilecard', 'mycard'],
  description: 'generate your aesthetic profile card',
  category: 'social',
  usage: 'card [@user]',
  cooldown: 12_000,

  async execute(message, args, client) {
    const target = message.mentions.users.first() ?? message.author;
    const user   = getUser(target.id);
    const hearts = getHearts(target.id);

    // Typing indicator while generating
    await message.channel.sendTyping().catch(() => {});

    const loadingEmbed = luvEmbed(COLORS.primary)
      .setDescription(`${EMOJIS.sparkle} generating **${target.username}'s** card... ✦`)
      .setFooter(footer(client));
    const loadMsg = await message.reply({ embeds: [loadingEmbed] });

    try {
      const themeId = getUserTheme(target.id);
      const buffer = await generateCard({
        username:   target.username,
        avatarURL:  target.displayAvatarURL({ extension: 'png', size: 256 }),
        pronouns:   user.pronouns,
        bio:        user.bio,
        interests:  user.interests ?? [],
        xp:         user.xp       ?? 0,
        streak:     user.streak    ?? 0,
        hearts,
        aura:       user.aura      ?? 'soft',
      }, themeId);

      const attachment = new AttachmentBuilder(buffer, { name: `${target.username}-card.png` });

      const { current } = getLevelData(user.xp ?? 0);
      const resultEmbed = luvEmbed(current.color)
        .setAuthor({ name: `${target.username}'s profile card ✦`, iconURL: target.displayAvatarURL({ dynamic: true }) })
        .setImage(`attachment://${target.username}-card.png`)
        .setFooter(footer(client));

      const row = buildButtons(
        { id: 'profile_edit', label: 'edit profile', emoji: '✏️',  style: ButtonStyle.Primary },
        { id: 'profile_aura', label: 'change aura',  emoji: '🌸',  style: ButtonStyle.Secondary },
        { id: 'daily_claim',  label: 'claim daily',  emoji: '🎁',  style: ButtonStyle.Success },
      );

      await loadMsg.edit({ embeds: [resultEmbed], files: [attachment], components: [row] });
    } catch (err) {
      console.error('[CARD ERROR]', err);
      await loadMsg.edit({
        embeds: [errorEmbed('card generation failed. make sure your avatar is accessible ✦')],
        components: [],
      });
    }
  },
};
