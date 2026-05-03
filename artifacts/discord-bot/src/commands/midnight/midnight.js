import { ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, COMFORT_MESSAGES } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';

const MIDNIGHT_PROMPTS = [
  'what\'s the thought you keep pushing away?',
  'who are you thinking about right now?',
  'what would you say if they were here?',
  'what feeling have you been ignoring today?',
  'what would future you tell current you right now?',
  'what are you afraid to want?',
  'who do you miss most right now?',
  'what\'s something you need to stop pretending is okay?',
];

export default {
  name: 'midnight',
  aliases: ['night', 'lonely', 'vibe'],
  description: 'midnight mode — emotional late-night space',
  category: 'midnight',
  usage: 'midnight',
  cooldown: 4_000,

  async execute(message, args, client) {
    const hour = new Date().getHours();
    const isLateNight = hour >= 22 || hour <= 4;
    const prompt  = MIDNIGHT_PROMPTS[Math.floor(Math.random() * MIDNIGHT_PROMPTS.length)];
    const comfort = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];

    const { oldXP, newXP } = addXP(message.author.id, 5);
    await checkLevelUp(message.author.id, oldXP, newXP, message.channel, client);

    // night owl achievement — used after 10pm or before 4am
    if (isLateNight) {
      await unlock(message.author.id, 'night_owl', client);
    }

    const embed = luvEmbed(COLORS.midnight)
      .setAuthor({ name: `midnight mode ✦ ${isLateNight ? '🌙' : '🕯️'}` })
      .setTitle(isLateNight ? 'it\'s late. you\'re still up.' : 'wherever you are, luvly is here ✦')
      .addFields(
        { name: 'tonight\'s prompt', value: `*"${prompt}"*` },
        { name: 'a reminder',        value: `*"${comfort}"*` },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '🌙', style: ButtonStyle.Primary },
      { id: 'midnight_comfort', label: 'comfort me',    emoji: '💙', style: ButtonStyle.Secondary },
      { id: 'midnight_vibe',    label: 'vibe check',    emoji: '✨', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
