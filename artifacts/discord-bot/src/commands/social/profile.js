import {
  AttachmentBuilder, ButtonStyle, MessageFlags,
  ContainerBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  ActionRowBuilder, ButtonBuilder,
} from 'discord.js';
import { EMOJIS, getLevelData } from '../../config.js';
import { luvContainer } from '../../utils/embeds.js';
import { getUser, getHearts, saveUser, getUserTheme } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { generateCard } from '../../utils/cardGenerator.js';

const CV2 = MessageFlags.IsComponentsV2;

function profileContainer(username, filename, color, isSelf) {
  const c = new ContainerBuilder().setAccentColor(color ?? 0xEDB5F8);

  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(`**﹕ⵌ┆ ${username}'s Profile ꩜ .**`)
  );

  c.addMediaGalleryComponents(
    new MediaGalleryBuilder().addItems(
      new MediaGalleryItemBuilder().setURL(`attachment://${filename}`)
    )
  );

  if (isSelf) {
    c.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('profile_edit').setLabel('edit profile').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('profile_aura').setLabel('change aura').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('daily_claim').setLabel('claim daily').setStyle(ButtonStyle.Success),
      )
    );
  }

  return c;
}

export default {
  name:        'profile',
  aliases:     ['p'],
  description: "view yours or someone's profile card",
  category:    'social',
  usage:       'profile [@user]',
  cooldown:    5_000,

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

    const loadContainer = new ContainerBuilder().setAccentColor(current.color ?? 0xEDB5F8);
    loadContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> ${EMOJIS.sparkle} generating **${target.username}'s** profile card... ✦`
      )
    );
    const loadMsg = await message.reply({ flags: CV2, components: [loadContainer] });

    try {
      const themeId  = getUserTheme(target.id);
      const buffer   = await generateCard({
        username:  target.username,
        avatarURL: target.displayAvatarURL({ extension: 'png', size: 256 }),
        pronouns:  user.pronouns,
        bio:       user.bio,
        interests: user.interests ?? [],
        xp:        user.xp       ?? 0,
        streak:    user.streak    ?? 0,
        hearts,
        aura:      user.aura ?? 'soft',
      }, themeId);

      const filename   = `${target.username}-profile.png`;
      const attachment = new AttachmentBuilder(buffer, { name: filename });
      const container  = profileContainer(target.username, filename, current.color, isSelf);

      await loadMsg.edit({ flags: CV2, files: [attachment], components: [container] });
    } catch (err) {
      console.error('[PROFILE CARD ERROR]', err);
      await loadMsg.edit({
        flags: CV2,
        components: [luvContainer('> profile card failed to generate. try again ✦')],
      });
    }
  },
};
