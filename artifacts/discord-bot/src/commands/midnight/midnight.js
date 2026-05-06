import { ButtonStyle, MessageFlags } from 'discord.js';
import { EMOJIS, COMFORT_MESSAGES } from '../../config.js';
import { luvContainer, buildButtons } from '../../utils/embeds.js';
import { addXP } from '../../utils/database.js';
import { unlock } from '../../utils/achievements.js';
import { checkLevelUp } from '../../utils/levelUp.js';

const R   = '<:right:1501255316350959858>';
const CV2 = MessageFlags.IsComponentsV2;

const MIDNIGHT_PROMPTS = [
  "what's the thought you keep pushing away?",
  'who are you thinking about right now?',
  'what would you say if they were here?',
  "what feeling have you been ignoring today?",
  'what would future you tell current you right now?',
  'what are you afraid to want?',
  'who do you miss most right now?',
  "what's something you need to stop pretending is okay?",
];

export default {
  name: 'midnight',
  aliases: ['night', 'lonely', 'vibe'],
  description: 'midnight mode — emotional late-night space',
  category: 'midnight',
  usage: 'midnight',
  cooldown: 4_000,

  async execute(message, args, client) {
    const hour        = new Date().getHours();
    const isLateNight = hour >= 22 || hour <= 4;
    const prompt  = MIDNIGHT_PROMPTS[Math.floor(Math.random() * MIDNIGHT_PROMPTS.length)];
    const comfort = COMFORT_MESSAGES[Math.floor(Math.random() * COMFORT_MESSAGES.length)];

    const { oldXP, newXP } = addXP(message.author.id, 5);
    await checkLevelUp(message.author.id, oldXP, newXP, message.channel, client);

    if (isLateNight) await unlock(message.author.id, 'night_owl', client);

    const text =
      `**﹕ⵌ┆ ${EMOJIS.moon} Midnight Mode ${isLateNight ? '' : ''} ꩜ .**\n\n` +
      `${isLateNight ? "it's late. you're still up." : 'wherever you are, luvly is here ✦'}\n\n` +
      `${R} **Tonight's Prompt:**\n` +
      `> *"${prompt}"*\n\n` +
      `${R} **A Reminder:**\n` +
      `> *"${comfort}"*`;

    const row = buildButtons(
      { id: 'midnight_confess', label: 'say something', emoji: '', style: ButtonStyle.Primary },
      { id: 'midnight_comfort', label: 'comfort me',    emoji: '', style: ButtonStyle.Secondary },
      { id: 'midnight_vibe',    label: 'vibe check',    emoji: '', style: ButtonStyle.Secondary },
    );

    await message.reply({ flags: CV2, components: [luvContainer(text, row)] });
  },
};
