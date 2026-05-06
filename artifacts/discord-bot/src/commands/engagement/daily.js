import {
  AttachmentBuilder, ButtonStyle, MessageFlags,
  ContainerBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  ActionRowBuilder, ButtonBuilder,
} from 'discord.js';
import { EMOJIS, getLevelData } from '../../config.js';
import { luvContainer } from '../../utils/embeds.js';
import { getUser, getHearts, getUserTheme, claimDaily } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';
import { generateDailyCard } from '../../utils/cardGenerator.js';

const CV2 = MessageFlags.IsComponentsV2;

export default {
  name:        'daily',
  aliases:     ['claim', 'checkin', 'check-in'],
  description: 'claim your daily hearts & XP reward',
  category:    'engagement',
  usage:       'daily',
  cooldown:    0,

  async execute(message, args, client) {
    const result = claimDaily(message.author.id);

    if (!result.success) {
      const text =
        `**﹕ⵌ┆ ${EMOJIS.heart} Already Claimed ꩜ .**\n\n` +
        `you've already picked up today's reward.\n\n` +
        `>  come back in **${result.waitH}h ${result.waitM}m** for your next drop. `;
      const waitRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('profile_view').setLabel('my profile').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('rank_view').setLabel('my rank').setStyle(ButtonStyle.Secondary),
      );
      return message.reply({ flags: CV2, components: [luvContainer(text, waitRow)] });
    }

    if (result.streak >= 3)  unlock(message.author.id, 'streak_3',  client);
    if (result.streak >= 7)  unlock(message.author.id, 'streak_7',  client);
    if (result.streak >= 30) unlock(message.author.id, 'streak_30', client);

    await checkLevelUp(message.author.id, result.oldXP, result.newXP, message.channel, client);

    await message.channel.sendTyping().catch(() => {});

    const user    = getUser(message.author.id);
    const hearts  = getHearts(message.author.id);
    const { current } = getLevelData(result.newXP);

    const loadContainer = new ContainerBuilder().setAccentColor(current.color ?? 0xEDB5F8);
    loadContainer.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `> ${EMOJIS.sparkle} generating your daily card... ✦`
      )
    );
    const loadMsg = await message.reply({ flags: CV2, components: [loadContainer] });

    try {
      const themeId = getUserTheme(message.author.id);
      const buffer  = await generateDailyCard({
        username:     message.author.username,
        avatarURL:    message.author.displayAvatarURL({ extension: 'png', size: 256 }),
        hearts,
        xp:           result.newXP,
        streak:       result.streak,
        earnedHearts: result.hearts,
        earnedXp:     result.xp,
        multiplier:   result.multiplier ?? 1,
        aura:         user.aura ?? 'soft',
      }, themeId);

      const filename   = `${message.author.username}-daily.png`;
      const attachment = new AttachmentBuilder(buffer, { name: filename });

      const container = new ContainerBuilder().setAccentColor(current.color ?? 0xEDB5F8);
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**﹕ⵌ┆ ${EMOJIS.sparkle} Daily Reward Claimed ꩜ .**`)
      );
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(
          new MediaGalleryItemBuilder().setURL(`attachment://${filename}`)
        )
      );
      container.addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('profile_view').setLabel('my profile').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('match_again').setLabel('find a match').setStyle(ButtonStyle.Secondary),
        )
      );

      await loadMsg.edit({ flags: CV2, files: [attachment], components: [container] });
    } catch (err) {
      console.error('[DAILY CARD ERROR]', err);
      const { current: lvl } = getLevelData(result.newXP);
      const R = '<:right:1501255316350959858>';
      const streakLine = result.streak >= 7
        ? ` **${result.streak} day streak!** you're on fire!`
        : result.streak >= 3
          ? ` **${result.streak} day streak** — keep it up!`
          : ` Day **${result.streak}** streak`;
      const fallback =
        `**﹕ⵌ┆ ${EMOJIS.sparkle} Daily Reward Claimed ꩜ .**\n\n` +
        `hey **${message.author.username}** \n\n` +
        `${R} **Rewards:**\n` +
        `> ⤿   **+${result.hearts} hearts** added\n` +
        `> ⤿   **+${result.xp} XP** earned\n` +
        `> ⤿  ${streakLine}` +
        (lvl.level > getLevelData(result.oldXP).current.level
          ? `\n\n${R} **Level Up!**\n> ⤿   you reached **lv${lvl.level} · ${lvl.title}** ✦`
          : '');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('profile_view').setLabel('my profile').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('match_again').setLabel('find a match').setStyle(ButtonStyle.Secondary),
      );
      await loadMsg.edit({ flags: CV2, components: [luvContainer(fallback, row)] });
    }
  },
};
