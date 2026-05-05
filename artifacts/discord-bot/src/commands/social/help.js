import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } from 'discord.js';
import { COLORS, EMOJIS, PREFIXES } from '../../config.js';
import { luvEmbed, footer } from '../../utils/embeds.js';

const CATEGORIES = {
  social:      { emoji: '❤️',  label: 'social',      desc: 'profile · card · aura · bio · themes' },
  matchmaking: { emoji: '💌',  label: 'matchmaking', desc: 'match · crush · soulmate · daily' },
  midnight:    { emoji: '🌙',  label: 'midnight',     desc: 'midnight · comfort · vibe · lonely' },
  confession:  { emoji: '🎭',  label: 'confession',   desc: 'confess · secret · admire · reveal' },
  chemistry:   { emoji: '⚗️',  label: 'chemistry',    desc: 'chemistry · streak · admirer · duo' },
  engagement:  { emoji: '🎮',  label: 'engagement',   desc: 'rank · xp · level · leaderboard' },
  ai:          { emoji: '🤖',  label: 'ai',           desc: 'rizz · flirt · vibecheck · starter' },
  safety:      { emoji: '🛡️',  label: 'safety',       desc: 'report · block · verify · trust' },
  hidden:      { emoji: '🔥',  label: 'hidden',       desc: 'miss · overthink · ghost · playlist' },
};

export default {
  name: 'help',
  aliases: ['h', 'commands', 'cmd'],
  description: 'show all commands',
  category: 'social',
  usage: 'help [category]',

  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all Luvly commands and categories')
    .addStringOption(o =>
      o.setName('category')
        .setDescription('Explore a specific category')
        .addChoices(
          { name: '❤️ social',      value: 'social' },
          { name: '💌 matchmaking', value: 'matchmaking' },
          { name: '🌙 midnight',    value: 'midnight' },
          { name: '🎭 confession',  value: 'confession' },
          { name: '⚗️ chemistry',   value: 'chemistry' },
          { name: '🎮 engagement',  value: 'engagement' },
          { name: '🤖 ai',          value: 'ai' },
          { name: '🛡️ safety',      value: 'safety' },
          { name: '🔥 hidden',      value: 'hidden' },
        )
    ),

  async execute(message, args, client) {
    const catArg = args[0]?.toLowerCase();
    const cat    = CATEGORIES[catArg];

    if (catArg && cat) {
      const cmds = [...client.commands.values()].filter(c => c.category === catArg);
      const embed = luvEmbed(COLORS.primary)
        .setTitle(`${cat.emoji} ${cat.label} commands ✦`)
        .setDescription(
          cmds.map(c =>
            `**u ${c.name}**${c.aliases?.length ? '  ·  ' + c.aliases.map(a => `**u ${a}**`).join('  ·  ') : ''}\n> *${c.description}*  ·  \`${c.usage}\``
          ).join('\n\n') || '*no commands in this category*'
        )
        .setFooter(footer(client));
      return await message.reply({ embeds: [embed] });
    }

    const embed = luvEmbed(COLORS.primary)
      .setTitle(`${EMOJIS.sparkle} luvly command system ✦`)
      .setDescription(
        '**prefixes:** `luv` · `u`  ·  **or use slash commands** `/command`\n\n' +
        '**quick start:**\n' +
        '`u p` — your profile\n' +
        '`u c @user` — set your crush\n' +
        '`u chem @user` — chemistry check\n' +
        '`u rizz` — get a line\n' +
        '`u midnight` — late night mode\n' +
        '`u rank` — your xp & level\n' +
        '`u confess` — anonymous post\n' +
        '`u miss` — late night feelings\n' +
        '`u ghost` — ghost tracker\n' +
        '`u overthink` — midnight thoughts\n\n' +
        '*use the menu below to explore categories ↓*'
      )
      .addFields(
        Object.entries(CATEGORIES).map(([key, c]) => ({
          name:   `${c.emoji} ${c.label}`,
          value:  c.desc,
          inline: true,
        }))
      )
      .setFooter(footer(client));

    const select = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('explore a category...')
      .addOptions(
        Object.entries(CATEGORIES).map(([key, c]) => ({
          label:       c.label,
          description: c.desc,
          value:       key,
          emoji:       c.emoji,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);
    await message.reply({ embeds: [embed], components: [row] });
  },
};
