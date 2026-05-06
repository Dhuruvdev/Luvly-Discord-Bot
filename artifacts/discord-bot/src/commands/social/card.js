import {
  AttachmentBuilder, ButtonStyle, MessageFlags,
  ContainerBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  ActionRowBuilder, ButtonBuilder,
} from 'discord.js';
import { EMOJIS, getLevelData } from '../../config.js';
import { luvContainer } from '../../utils/embeds.js';
import { getUser, getHearts, getUserTheme } from '../../utils/database.js';
import { generateCard } from '../../utils/cardGenerator.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name:        'card',
  aliases:     ['profilecard', 'mycard'],
  description: 'generate your aesthetic profile card',
  category:    'social',
  usage:       'card [@user]',
  cooldown:    12_000,

  async execute(message, args, client) {
    const target = message.mentions.users.filter(u => !u.bot).first() ?? message.author;
    const user   = getUser(target.id);
    const hearts = getHearts(target.id);
    const isSelf = target.id === message.author.id;
    const { current } = getLevelData(user.xp ?? 0);

    await message.channel.sendTyping().catch(() => {});

    const loadContainer = new ContainerBuilder().setAccentColor(current.color ?? 0xEDB5F8);
    loadContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> ${EMOJIS.sparkle} generating **${target.username}'s** card... ✦`
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

      const filename   = `${target.username}-card.png`;
      const attachment = new AttachmentBuilder(buffer, { name: filename });

      const container = new ContainerBuilder().setAccentColor(current.color ?? 0xEDB5F8);
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**﹕ⵌ┆ ${target.username}'s Profile Card ꩜ .**`)
      );
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(`attachment://${filename}`)
        )
      );
      if (isSelf) {
        container.addActionRowComponents(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('profile_edit').setLabel('edit profile').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('profile_aura').setLabel('change aura').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('daily_claim').setLabel('claim daily').setStyle(ButtonStyle.Success),
          )
        );
      }

      await loadMsg.edit({ flags: CV2, files: [attachment], components: [container] });
    } catch (err) {
      console.error('[CARD ERROR]', err);
      await loadMsg.edit({
        flags: CV2,
        components: [luvContainer('> card generation failed. make sure your avatar is accessible ✦')],
      });
    }
  },
};
