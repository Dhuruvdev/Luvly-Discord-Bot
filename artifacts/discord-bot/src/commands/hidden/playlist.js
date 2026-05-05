import { SlashCommandBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config.js';
import { luvEmbed, buildButtons, footer } from '../../utils/embeds.js';

const PLAYLISTS = [
  { name: 'soft hours',          vibe: "for when you miss someone and won't admit it",        tracks: ['TV — Billie Eilish', 'Heather — Conan Gray', 'Telepatía — Kali Uchis', 'Lover — Taylor Swift'] },
  { name: 'midnight drive',      vibe: 'windows down, feelings too loud to ignore',            tracks: ['drivers license — Olivia Rodrigo', 'Liability — Lorde', 'Falling — Harry Styles', '4am — bülow'] },
  { name: "i'm fine, i'm not",  vibe: "when you're holding it together just barely",          tracks: ['The Night Will Always Win — Manchester Orchestra', 'Sober — Demi Lovato', 'Clean — Taylor Swift'] },
  { name: 'main character',      vibe: 'for when you finally choose yourself',                 tracks: ['Good 4 u — Olivia Rodrigo', 'Cruel Summer — Taylor Swift', 'Confident — Demi Lovato'] },
  { name: 'soft glow',           vibe: 'cozy, warm, no pressure — just existing',              tracks: ['Sunset Lover — Petit Biscuit', 'Golden — Harry Styles', 'Electric Love — BØRNS'] },
];

export default {
  name: 'playlist',
  aliases: [],
  description: 'get a shared vibe playlist for your mood',
  category: 'hidden',
  usage: 'playlist',

  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Get a curated vibe playlist for your current mood'),

  async execute(message, args, client) {
    const pl = PLAYLISTS[Math.floor(Math.random() * PLAYLISTS.length)];

    const embed = luvEmbed(COLORS.purple)
      .setTitle(`${EMOJIS.music} "${pl.name}" ✦`)
      .setDescription(`> *${pl.vibe}*`)
      .addFields(
        {
          name:  'tracklist',
          value: pl.tracks.map((t, i) => `${i + 1}. ${t}`).join('\n'),
        },
        {
          name:  'tip',
          value: '> *search these on spotify or youtube music for the best experience ✦*',
        },
      )
      .setFooter(footer(client));

    const row = buildButtons(
      { id: 'rizz_new',         label: 'different vibe', emoji: '🔄', style: ButtonStyle.Secondary },
      { id: 'midnight_comfort', label: 'comfort mode',   emoji: '🌙', style: ButtonStyle.Secondary },
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
