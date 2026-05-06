import {
  MessageFlags, ButtonStyle,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
  ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder,
} from 'discord.js';

const CV2 = MessageFlags.IsComponentsV2;
const R   = '<:right:1501255316350959858>';

// ── Terms of Service container ─────────────────────────────────────────────────

export function buildTOSContainer() {
  const text =
    `**﹕ⵌ┆ <:luvly:1501269739324838151> Luvly — Terms of Service & Privacy Policy ꩜ .**\n\n` +
    `**Before you begin, please read and accept our Terms of Service.**\n\n` +
    `${R} **1. Eligibility**\n` +
    `> ⤿  You must be at least **13 years of age** to use Luvly (Discord's minimum requirement).\n` +
    `> ⤿  By accepting, you confirm that you meet this age requirement.\n\n` +
    `${R} **2. Data & Privacy**\n` +
    `> ⤿  We collect and store only the profile information you voluntarily provide.\n` +
    `> ⤿  This includes your bio, pronouns, interests, and gender.\n` +
    `> ⤿  No personal data is shared with third parties or used for commercial purposes.\n` +
    `> ⤿  Your data may be reset or removed by server administrators at any time.\n\n` +
    `${R} **3. Limitation of Liability**\n` +
    `> ⤿  Luvly is provided **as-is** for social and entertainment purposes only.\n` +
    `> ⤿  **We are not responsible** for any outcomes, relationships, or situations\n` +
    `>      that arise from the use of this bot or its features.\n` +
    `> ⤿  All user-generated content is the sole responsibility of its creator.\n` +
    `> ⤿  The Luvly team is **not liable** for any emotional, social, or personal\n` +
    `>      consequences resulting from interactions facilitated by this bot.\n\n` +
    `${R} **4. Community Conduct**\n` +
    `> ⤿  You agree to use Luvly respectfully and in accordance with your server rules.\n` +
    `> ⤿  Harassment, abuse, or exploitation of any bot feature may result in removal.\n\n` +
    `${R} **5. Changes to Terms**\n` +
    `> ⤿  We reserve the right to modify or discontinue the service at any time without notice.\n` +
    `> ⤿  Continued use following any update constitutes acceptance of the revised terms.\n\n` +
    `*By clicking **Accept & Continue** you confirm you have read, understood,\nand agree to these Terms of Service and Privacy Policy.*`;

  const container = new ContainerBuilder().setAccentColor(0x26272F);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
  try {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
  } catch (_) {}
  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_accept')
        .setLabel('Accept & Continue')
        .setStyle(ButtonStyle.Success)
    )
  );
  return container;
}

// ── Profile creation form container ────────────────────────────────────────────

export function buildProfileFormContainer(genderSelected = null) {
  const confirmed = genderSelected !== null;
  const genderLabel = confirmed
    ? genderSelected.charAt(0).toUpperCase() + genderSelected.slice(1)
    : null;

  const text =
    `**﹕ⵌ┆ <:luvly:1501269739324838151> Create Your Profile ꩜ .**\n\n` +
    `**You've accepted our terms — let's set up your profile.**\n\n` +
    `${R} **What we'll collect via the form:**\n` +
    `> ⤿  **Bio** — a short intro about yourself *(max 120 chars, required)*\n` +
    `> ⤿  **Pronouns** — how you'd like to be addressed *(required)*\n` +
    `> ⤿  **Interests** — up to 5 things you're into, comma separated *(optional)*\n\n` +
    `${R} **Step 1 — Select your gender below**\n` +
    (confirmed
      ? `> ⤿  Gender set to **${genderLabel}** ✦\n\n`
      : `> ⤿  *Choose an option from the dropdown below to continue*\n\n`) +
    `${R} **Step 2 — Click Create Profile** to fill in your details` +
    (!confirmed ? `\n> ⤿  *(this button unlocks after selecting your gender)*` : '');

  const container = new ContainerBuilder().setAccentColor(0x57F287);
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
  try {
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
  } catch (_) {}

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setup_create')
        .setLabel('Create Profile')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!confirmed)
    )
  );

  container.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('setup_gender')
        .setPlaceholder(confirmed ? `Gender: ${genderLabel} — change?` : 'Select your gender...')
        .addOptions([
          { label: 'Male',   value: 'male',   description: 'I identify as male'   },
          { label: 'Female', value: 'female', description: 'I identify as female' },
        ])
    )
  );

  return container;
}

// ── Command ────────────────────────────────────────────────────────────────────

export default {
  name:        'setup',
  aliases:     ['start', 'register', 'begin', 'create'],
  description: 'set up your luvly profile',
  category:    'social',
  usage:       'setup',

  async execute(message, args, client) {
    await message.reply({
      flags: CV2,
      components: [buildTOSContainer()],
    });
  },
};
