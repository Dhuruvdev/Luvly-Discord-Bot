import { useState } from 'react';

const QUESTIONS = [
  {
    q: 'it\'s 2am. what are you doing?',
    opts: [
      { text: 'journaling about feelings',   aura: 'soft' },
      { text: 'staring at the ceiling',      aura: 'midnight' },
      { text: 'texting someone first',        aura: 'magnetic' },
      { text: 'chaotic midnight snack run',   aura: 'chaotic' },
    ],
  },
  {
    q: 'pick your aesthetic:',
    opts: [
      { text: '🕯️ candles & soft lighting',  aura: 'soft' },
      { text: '✨ starry night vibes',         aura: 'ethereal' },
      { text: '💜 mysterious & magnetic',      aura: 'magnetic' },
      { text: '🌑 dark academia chaos',        aura: 'midnight' },
    ],
  },
  {
    q: 'your love language is:',
    opts: [
      { text: 'words of affirmation',         aura: 'soft' },
      { text: 'quality time (deep talks)',     aura: 'midnight' },
      { text: 'acts of service',               aura: 'golden' },
      { text: 'touch & spontaneous plans',     aura: 'chaotic' },
    ],
  },
  {
    q: 'someone new texts you. you:',
    opts: [
      { text: 'overthink the reply for 10min', aura: 'soft' },
      { text: 'reply instantly — no filter',   aura: 'chaotic' },
      { text: 'take your time, be mysterious', aura: 'magnetic' },
      { text: 'write a poem as the reply',     aura: 'ethereal' },
    ],
  },
  {
    q: 'your vibe in three words:',
    opts: [
      { text: 'soft, warm, caring',            aura: 'soft' },
      { text: 'rare, glowing, golden',         aura: 'golden' },
      { text: 'intense, deep, magnetic',       aura: 'magnetic' },
      { text: 'dreamy, floaty, ethereal',      aura: 'ethereal' },
    ],
  },
];

const AURAS: Record<string, { label: string; emoji: string; desc: string; color: string; bg: string }> = {
  soft:     { label: 'Soft',     emoji: '🌸', desc: 'warm, gentle, and deeply caring — people feel safe with you', color: '#F9A8D4', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd9)' },
  ethereal: { label: 'Ethereal', emoji: '🌙', desc: 'dreamy and otherworldly — you live between fantasy and feeling', color: '#C4A3DF', bg: 'linear-gradient(135deg, #e8d5f5, #c4a3df88)' },
  magnetic: { label: 'Magnetic', emoji: '✦',  desc: 'effortlessly captivating — people can\'t help but orbit around you', color: '#EDB5F8', bg: 'linear-gradient(135deg, #f3e5f5, #edb5f888)' },
  chaotic:  { label: 'Chaotic',  emoji: '⚡', desc: 'unpredictably electric — you keep people on their toes', color: '#FCA5A5', bg: 'linear-gradient(135deg, #fce4e4, #fca5a588)' },
  midnight: { label: 'Midnight', emoji: '☽',  desc: 'deep and introspective — you shine brightest in the dark', color: '#A5B4FC', bg: 'linear-gradient(135deg, #e8eaff, #a5b4fc88)' },
  golden:   { label: 'Golden',   emoji: '⭐', desc: 'radiant and rare — you make everyone around you feel special', color: '#FCD34D', bg: 'linear-gradient(135deg, #fffde7, #fcd34d88)' },
};

export function AuraQuizGame() {
  const [step, setStep]     = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone]     = useState(false);
  const [result, setResult] = useState('');

  const q = QUESTIONS[step];

  const choose = (aura: string, i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const next = [...answers, aura];
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        setAnswers(next);
        setStep(s => s + 1);
        setPicked(null);
      } else {
        // tally votes
        const tally: Record<string, number> = {};
        next.forEach(a => { tally[a] = (tally[a] ?? 0) + 1; });
        const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        setResult(top);
        setDone(true);
      }
    }, 500);
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setPicked(null);
    setDone(false);
    setResult('');
  };

  const progress = (step / QUESTIONS.length) * 100;
  const aura     = AURAS[result] ?? AURAS['soft'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 50%, #1e0a38 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
    }}>
      <div style={{
        width: 360,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        borderRadius: 36,
        border: '1.5px solid rgba(255,255,255,0.12)',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        minHeight: 600,
      }}>
        {/* Status bar */}
        <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', opacity: 0.5, fontSize: 11, color: '#fff' }}>
          <span>9:41</span><span>●●● WiFi 100%</span>
        </div>

        {/* Header */}
        <div style={{ padding: '16px 24px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 4 }}>luvly games</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#EDB5F8', letterSpacing: -0.5 }}>aura quiz ☽</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>discover your true vibe</div>
        </div>

        {!done ? (
          <>
            {/* Progress bar */}
            <div style={{ padding: '0 24px 16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`, height: '100%',
                  background: 'linear-gradient(90deg, #EDB5F8, #C4A3DF)',
                  borderRadius: 99, transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>question {step + 1} of {QUESTIONS.length}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{Math.round(progress)}%</span>
              </div>
            </div>

            {/* Question */}
            <div style={{
              margin: '0 20px 16px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 20, padding: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              minHeight: 80, display: 'flex', alignItems: 'center',
            }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 16, lineHeight: 1.4 }}>
                {q.q}
              </div>
            </div>

            {/* Options */}
            <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {q.opts.map((opt, i) => {
                const isChosen = picked === i;
                const isOther  = picked !== null && picked !== i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(opt.aura, i)}
                    style={{
                      width: '100%', padding: '13px 16px',
                      borderRadius: 16, textAlign: 'left',
                      background: isChosen
                        ? 'rgba(237,181,248,0.25)'
                        : isOther
                          ? 'rgba(255,255,255,0.03)'
                          : 'rgba(255,255,255,0.08)',
                      border: isChosen
                        ? '1.5px solid rgba(237,181,248,0.6)'
                        : '1.5px solid rgba(255,255,255,0.1)',
                      color: isOther ? 'rgba(255,255,255,0.35)' : '#fff',
                      fontWeight: isChosen ? 700 : 500,
                      fontSize: 13, cursor: picked !== null ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {isChosen ? '✦ ' : ''}{opt.text}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* Result screen */
          <div style={{ padding: '0 20px 28px' }}>
            <div style={{
              borderRadius: 24, padding: 24, textAlign: 'center',
              background: 'rgba(255,255,255,0.09)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{aura.emoji}</div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: 4 }}>your aura is</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: aura.color, letterSpacing: -0.5, marginBottom: 12 }}>
                {aura.label}
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '14px 16px',
                color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 1.6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {aura.desc}
              </div>
            </div>

            {/* Aura badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '12px 16px',
              border: `1px solid ${aura.color}44`, marginBottom: 16,
            }}>
              <div style={{ fontSize: 20 }}>{aura.emoji}</div>
              <div>
                <div style={{ color: aura.color, fontWeight: 700, fontSize: 13 }}>{aura.label} Aura unlocked</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>set as your luvly aura with /aura</div>
              </div>
            </div>

            <button onClick={restart} style={{
              width: '100%', padding: 13, borderRadius: 18,
              background: 'linear-gradient(135deg, #EDB5F8, #C4A3DF)',
              border: 'none', color: '#1a0a2e', fontWeight: 800, fontSize: 14,
              cursor: 'pointer',
            }}>
              ↺  retake quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
