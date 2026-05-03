/**
 * Standalone test script — generates a sample profile card and saves it.
 * Run with:  node generate-test-card.mjs
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

// Bootstrap the config path so cardGenerator resolves correctly
process.chdir(__dir);

const { generateCard } = await import('./src/utils/cardGenerator.js');

const testData = {
  username:   'Lylac',
  avatarURL:  null,          // no real URL — placeholder will be drawn
  pronouns:   'she/her',
  bio:        'artist • animator',
  interests:  ['swiftie', 'travel', 'libra'],
  xp:         500,
  streak:     7,
  hearts:     120,
  aura:       'soft',
};

console.log('✦ generating test card...');
const buffer = await generateCard(testData);

const outPath = join(__dir, 'test-card.png');
writeFileSync(outPath, buffer);
console.log(`✦ saved → ${outPath}`);
