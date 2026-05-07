import { useState, useEffect } from 'react';

const WORDS = [
  { word: 'HEART',   hint: 'what you feel it with 🤍',   emoji: '♡' },
  { word: 'CRUSH',   hint: 'secret feelings for someone', emoji: '✦' },
  { word: 'SPARK',   hint: 'the start of something', emoji: '⚡' },
  { word: 'BLISS',   hint: 'pure happiness', emoji: '✿' },
  { word: 'AURA',    hint: 'your energy, your vibe', emoji: '☽' },
  { word: 'LOVER',   hint: 'someone who cares deeply', emoji: '◈' },
  { word: 'FLIRT',   hint: 'playful affection', emoji: '💜' },
  { word: 'BLOOM',   hint: 'to open up and grow', emoji: '🌸' },
];

function scramble(word: string) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('') === word ? scramble(word) : arr.join('');
}

export function WordRizzGame() {
  const [idx, setIdx]         = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [selected, setSelected]   = useState<number[]>([]);
  const [solved, setSolved]   = useState(false);
  const [wrong, setWrong]     = useState(false);
  const [score, setScore]     = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const current = WORDS[idx % WORDS.length];

  useEffect(() => {
    setScrambled(scramble(current.word));
    setSelected([]);
    setSolved(false);
    setWrong(false);
    setHintUsed(false);
    setShowHint(false);
  }, [idx]);

  const tiles = scrambled.split('');
  const guess  = selected.map(i => tiles[i]).join('');

  const tapTile = (i: number) => {
    if (solved) return;
    if (selected.includes(i)) {
      setSelected(selected.filter(x => x !== i));
    } else {
      const next = [...selected, i];
      setSelected(next);
      if (next.length === current.word.length) {
        const attempt = next.map(j => tiles[j]).join('');
        if (attempt === current.word) {
          setSolved(true);
          setScore(s => s + (hintUsed ? 1 : 2));
        } else {
          setWrong(true);
          setTimeout(() => { setSelected([]); setWrong(false); }, 700);
        }
      }
    }
  };

  const next = () => setIdx(i => i + 1);

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
      }}>
        {/* Status bar */}
        <div style={{ padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', opacity: 0.5, fontSize: 11, color: '#fff' }}>
          <span>9:41</span><span>●●● WiFi 100%</span>
        </div>

        {/* Header */}
        <div style={{ padding: '16px 24px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 4 }}>luvly games</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#EDB5F8', letterSpacing: -0.5 }}>word rizz ✦</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>unscramble the love word</div>
        </div>

        {/* Score */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '0 24px 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#EDB5F8' }}>{score}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>pts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#C4A3DF' }}>{(idx % WORDS.length) + 1}/{WORDS.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>word</div>
          </div>
        </div>

        {/* Word card */}
        <div style={{ margin: '0 20px', padding: 24, background: 'rgba(255,255,255,0.07)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{current.emoji}</div>

          {/* Answer slots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {current.word.split('').map((_, i) => {
              const letter = selected[i] !== undefined ? tiles[selected[i]] : '';
              return (
                <div key={i} style={{
                  width: 36, height: 44,
                  background: solved
                    ? 'rgba(237,181,248,0.25)'
                    : wrong
                      ? 'rgba(255,100,100,0.2)'
                      : letter
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  border: solved
                    ? '1.5px solid rgba(237,181,248,0.5)'
                    : wrong
                      ? '1.5px solid rgba(255,100,100,0.4)'
                      : letter
                        ? '1.5px solid rgba(255,255,255,0.25)'
                        : '1.5px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: solved ? '#EDB5F8' : '#fff',
                  fontWeight: 800, fontSize: 18,
                  transition: 'all 0.15s',
                }}>
                  {letter}
                </div>
              );
            })}
          </div>

          {/* Hint */}
          {showHint && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8, fontStyle: 'italic' }}>
              hint: {current.hint}
            </div>
          )}

          {solved && (
            <div style={{ color: '#EDB5F8', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
              ✦ {hintUsed ? '+1 pt (hint used)' : '+2 pts'}
            </div>
          )}
        </div>

        {/* Scrambled tiles */}
        <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
          {tiles.map((letter, i) => {
            const isSelected = selected.includes(i);
            return (
              <button
                key={i}
                onClick={() => tapTile(i)}
                style={{
                  width: 44, height: 52,
                  background: isSelected ? 'rgba(237,181,248,0.2)' : 'rgba(255,255,255,0.1)',
                  border: isSelected ? '2px solid rgba(237,181,248,0.6)' : '2px solid rgba(255,255,255,0.15)',
                  borderRadius: 12,
                  color: isSelected ? '#EDB5F8' : '#fff',
                  fontWeight: 800, fontSize: 20,
                  cursor: 'pointer',
                  opacity: isSelected ? 0.4 : 1,
                  transition: 'all 0.12s',
                }}>
                {letter}
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ padding: '0 20px 24px', display: 'flex', gap: 8 }}>
          {!solved ? (
            <>
              <button
                onClick={() => { setSelected([]); setWrong(false); }}
                style={{
                  flex: 1, padding: 13, borderRadius: 16,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                ↩ clear
              </button>
              <button
                onClick={() => { setShowHint(true); setHintUsed(true); }}
                style={{
                  flex: 1, padding: 13, borderRadius: 16,
                  background: 'rgba(196,163,223,0.15)', border: '1px solid rgba(196,163,223,0.3)',
                  color: '#C4A3DF', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                ☽ hint
              </button>
            </>
          ) : (
            <button
              onClick={next}
              style={{
                flex: 1, padding: 13, borderRadius: 18,
                background: 'linear-gradient(135deg, #EDB5F8, #C4A3DF)',
                border: 'none', color: '#1a0a2e', fontWeight: 800, fontSize: 14,
                cursor: 'pointer',
              }}>
              next word →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
