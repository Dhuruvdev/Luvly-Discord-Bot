/**
 * Generates a test card for every theme and saves them to test-cards/
 * Run: node generate-test-card.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname }            from 'path';
import { fileURLToPath }            from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
process.chdir(__dir);

const { generateCard }  = await import('./src/utils/cardGenerator.js');
const { THEME_LIST }    = await import('./src/themes/index.js');

const OUT = join(__dir, 'test-cards');
mkdirSync(OUT, { recursive: true });

const DATA = {
  username:   'Lylac',
  avatarURL:  null,
  pronouns:   'she/her',
  bio:        'artist • animator',
  interests:  ['swiftie', 'travel', 'libra'],
  xp:         500,
  streak:     7,
  hearts:     120,
  aura:       'soft',
};

for (const theme of THEME_LIST) {
  process.stdout.write(`✦ generating ${theme.name.padEnd(22)}`);
  const buf  = await generateCard(DATA, theme.id);
  const path = join(OUT, `${theme.id}.png`);
  writeFileSync(path, buf);
  console.log(`→ test-cards/${theme.id}.png`);
}

console.log('\n✦ all themes done!');
