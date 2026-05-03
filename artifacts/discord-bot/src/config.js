export const PREFIXES = ['luv ', 'Luv ', 'u '];

export const COLORS = {
  primary:   0xFF6B9D,
  purple:    0xC77DFF,
  rose:      0xFF4B6E,
  midnight:  0x1A1A2E,
  soft:      0xFFB3C6,
  gold:      0xFFD700,
  success:   0x57F287,
  error:     0xED4245,
  neutral:   0x2B2D31,
  aura:      0xE040FB,
};

export const EMOJIS = {
  heart:     '❤️',
  sparkle:   '✨',
  moon:      '🌙',
  star:      '⭐',
  fire:      '🔥',
  ghost:     '👻',
  music:     '🎧',
  lock:      '🔒',
  crown:     '👑',
  diamond:   '💎',
  chemistry: '⚗️',
  aura:      '🌸',
  streak:    '🔥',
  rank:      '🏆',
  rizz:      '💬',
  safety:    '🛡️',
  premium:   '💎',
  confession:'🎭',
  match:     '💌',
  midnight:  '🌙',
};

export const RIZZ_LINES = [
  "Are you a WiFi signal? Because I feel a strong connection.",
  "You must be made of copper and tellurium... because you're CuTe.",
  "Do you have a map? I keep getting lost in your vibe.",
  "Is your name Google? Because you've got everything I've been searching for.",
  "Are you a shooting star? Because I've been wishing for someone like you.",
  "You must be a magician, because every time I look at you, everyone else disappears.",
  "Do you believe in love at first sight, or should I walk by again?",
  "Are you the moon? Because even in the dark, you light everything up.",
  "I'd say you're my type, but you're clearly one of a kind.",
  "You're not just beautiful — you're the kind of beautiful that makes people forget what they were saying.",
  "Even the stars get jealous of how you shine.",
  "I was going to play it cool, but honestly? You broke my cool the second I saw you.",
  "You must be illegal — it shouldn't be this easy to steal someone's heart.",
  "Are you a dream? Because everything about you feels too good to be real.",
  "I write a lot — but I couldn't write a character more perfect than you.",
  "You're the reason I check my notifications with a smile.",
  "If feelings were currency, I'd be broke for you.",
  "I thought I was a whole person. Then I met you and realized I was just a draft.",
  "Your energy walks in a room before you do.",
  "Late night thoughts? They're usually about you.",
];

export const COMFORT_MESSAGES = [
  "hey. i know it's hard right now. but you made it through every bad day before this one too. 💙",
  "you don't have to have it together all the time. rest is valid. healing is valid. you are valid.",
  "the world is genuinely better with you in it. not because of what you do — because of who you are.",
  "it's okay to feel everything you're feeling. all of it. no feelings are wrong feelings.",
  "you've survived 100% of your worst days so far. that's an undefeated record.",
  "i don't know what you're going through but i know you're stronger than it feels right now.",
  "some nights are just hard. but morning always comes back. always.",
  "you matter. not as a concept. actually. right now. you matter.",
  "take a breath. you're still here. that's enough.",
  "sending you the softest energy. no pressure to be okay. just... here with you.",
];

export const OVERTHINK_MESSAGES = [
  "what if the best version of you is still being written?",
  "3am thought: are you living your life or just letting it happen to you?",
  "do you think the people who love you know how much you overthink about them?",
  "what would you do right now if you weren't afraid?",
  "you're not too much. you've just been around people with too little capacity.",
  "the version of you 5 years ago would be amazed at who you are now.",
  "what's one thing you've been pretending doesn't matter... that actually does?",
  "are you holding onto something you already know you need to let go of?",
  "your feelings are data, not destiny.",
  "the midnight version of you always knows what the daytime version is afraid to admit.",
];

export const XP_REWARDS = {
  daily:     50,
  message:   2,
  reaction:  1,
  chemistry: 10,
  confession:15,
  streak:    5,
};

export const LEVELS = [
  { level: 1,  xp: 0,    title: 'new soul',        color: 0x9E9E9E },
  { level: 2,  xp: 100,  title: 'soft heart',       color: 0xFFB3C6 },
  { level: 3,  xp: 250,  title: 'rising aura',      color: 0xC77DFF },
  { level: 4,  xp: 500,  title: 'glowing',          color: 0xFF6B9D },
  { level: 5,  xp: 1000, title: 'ethereal',         color: 0xFF4B6E },
  { level: 6,  xp: 2000, title: 'magnetic',         color: 0xFFD700 },
  { level: 7,  xp: 4000, title: 'iconic',           color: 0xE040FB },
  { level: 8,  xp: 7500, title: 'legendary lover',  color: 0xFF0000 },
];

export function getLevelData(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
    }
  }
  return { current, next };
}

export function getXpBar(xp, current, next) {
  if (!next) return '█████████████████████ MAX';
  const progress = xp - current.xp;
  const needed = next.xp - current.xp;
  const filled = Math.round((progress / needed) * 20);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
  return `${bar}  ${progress}/${needed}`;
}
