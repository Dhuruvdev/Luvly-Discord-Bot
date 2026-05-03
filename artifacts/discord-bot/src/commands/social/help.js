import { ButtonStyle, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { COLORS, EMOJIS, PREFIXES } from '../../config.js';
import { luvEmbed, footer } from '../../utils/embeds.js';

const CATEGORIES = {
  social:      { emoji: '❤️',  label: 'social',      desc: 'profile · aura · bio · badges' },
  matchmaking: { emoji: '💌',  label: 'matchmaking', desc: 'match · crush · soulmate · daily' },
  midnight:    { emoji: '🌙',  label: 'midnight',     desc: 'midnight · comfort · vibe · lonely' },
  confession:  { emoji: '🎭',  label: 'confession',   desc: 'confess · secret · admire · reveal' },
  chemistry:   { emoji: '⚗️',  label: 'chemistry',    desc: 'chemistry · streak · admirer · duo' },
  engagement:  { emoji: '🎮',  label: 'engagement',   desc: 'rank · xp · level · leaderboard' },
  ai:          { emoji: '🤖',  label: 'ai',           desc: 'rizz · flirt · vibecheck · starter' },
  safety:      { emoji: '🛡️',  label: 'safety',       desc: 'report · block · verify · trust' },
  premium:     { emoji: '💎',  label: 'premium',      desc: 'vip · glow · theme · elite' },
  hidden:      { emoji: '🔥',  label: 'hidden',       desc: 'miss · overthink · ghost · playlist' },
};

export default {
  name: 'help',
  aliases: ['h', 'commands', 'cmd'],
  description: 'show all commands',
  category: 'social',
  usage: 'help [category]',

  async execute(message, args, client) {
    const catArg = args[0]?.toLowerCase();
    const cat = CATEGORIES[catArg];

    if (catArg && cat) {
      const cmds = [...client.commands.values()].filter(c => c.category === catArg);
      const embed = luvEmbed(COLORS.primary)
        .setTitle(`${cat.emoji} ${cat.label} commands ✦`)
        .setDescription(
          cmds.map(c =>
            `**u ${c.name}** ${c.aliases?.map(a => `· **u ${a}**`).join(' ') || ''}\n*${c.description}*  ·  \`${c.usage}\``
          ).join('\n\n') || '*no commands found*'
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    const embed = luvEmbed(COLORS.primary)
      .setTitle(`${EMOJIS.sparkle} luvly command system ✦`)
      .setDescription(
        '**prefixes:** `luv` · `Luv` · `u`\n' +
        '*any prefix works — mix and match freely*\n\n' +
        '**quick commands:**\n' +
        '`u p` — your profile\n' +
        '`u c @user` — set crush\n' +
        '`u chem @user` — chemistry check\n' +
        '`u rizz` — get pickup line\n' +
        '`u midnight` — midnight mode\n' +
        '`u rank` — your xp + level\n' +
        '`u confess` — anonymous post\n' +
        '`u miss` — late night feelings\n' +
        '`u ghost` — ghost tracker\n' +
        '`u overthink` — midnight thoughts\n\n' +
        '*use `u help [category]` for details*'
      )
      .addFields(
        Object.entries(CATEGORIES).map(([key, c]) => ({
          name: `${c.emoji} ${c.label}`,
          value: c.desc,
          inline: true,
        }))
      )
      .setFooter(footer(client));

    const select = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('explore a category...')
      .addOptions(
        Object.entries(CATEGORIES).map(([key, c]) => ({
          label: c.label,
          description: c.desc,
          value: key,
          emoji: c.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    await message.reply({ embeds: [embed], components: [row] });
  },
};
