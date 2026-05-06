import { AttachmentBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, getLevelData } from '../../config.js';
import { luvEmbed, buildButtons, footer, errorEmbed } from '../../utils/embeds.js';
import { getUser, getHearts, saveUser, getUserTheme } from '../../utils/database.js';
import { getUserAchievements, unlock } from '../../utils/achievements.js';
import { generateCard } from '../../utils/cardGenerator.js';

export default {
  name: 'profile',
  aliases: ['p'],
  description: "view yours or someone's profile card",
  category: 'social',
  usage: 'profile [@user]',
  cooldown: 5_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const user   = getUser(target.id);
    const hearts = getHearts(target.id);
    const isSelf = target.id === message.author.id;
    const { current } = getLevelData(user.xp ?? 0);

    if (!isSelf) {
      saveUser(target.id, { profileViews: (user.profileViews ?? 0) + 1 });
      await unlock(message.author.id, 'profile_viewer', client).catch(() => {});
    }

    await message.channel.sendTyping().catch(() => {});

    const loadMsg = await message.reply({
      embeds: [
        luvEmbed(current.color ?? 0xEDB5F8)
          .setDescription(`${EMOJIS.sparkle} generating **${target.username}'s** profile card... ✦`)
          .setFooter(footer(client)),
      ],
    });

    try {
      const themeId = getUserTheme(target.id);
      const buffer  = await generateCard({
        username:  target.username,
        avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
        pronouns:  user.pronouns,
        bio:       user.bio,
        interests: user.interests ?? [],
        xp:        user.xp       ?? 0,
        streak:    user.streak    ?? 0,
        hearts,
        aura:      user.aura     ?? 'soft',
      }, themeId);

      const attachment = new AttachmentBuilder(buffer, { name: `${target.username}-profile.png` });

      const resultEmbed = luvEmbed(current.color ?? 0xEDB5F8)
        .setAuthor({
          name:    `${target.username}'s profile ✦`,
          iconURL: target.displayAvatarURL({ dynamic: true }),
        })
        .setImage(`attachment://${target.username}-profile.png`)
        .setFooter(footer(client));

      const buttons = isSelf
        ? buildButtons(
            { id: 'profile_edit', label: 'edit profile', emoji: '', style: ButtonStyle.Primary   },
            { id: 'profile_aura', label: 'change aura',  emoji: '', style: ButtonStyle.Secondary },
            { id: 'daily_claim',  label: 'claim daily',  emoji: '', style: ButtonStyle.Success   },
          )
        : null;

      await loadMsg.edit({
        embeds:     [resultEmbed],
        files:      [attachment],
        components: buttons ? [buttons] : [],
      });
    } catch (err) {
      console.error('[PROFILE CARD ERROR]', err);
      await loadMsg.edit({
        embeds:     [errorEmbed('profile card failed to generate. try again ✦')],
        components: [],
      });
    }
  },
};
