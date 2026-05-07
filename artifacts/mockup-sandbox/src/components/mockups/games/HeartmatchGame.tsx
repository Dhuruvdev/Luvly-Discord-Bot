import { useState, useEffect, useCallback } from 'react';

const SYMBOLS = [
  { id: 'heart',   icon: '♡', color: '#EDB5F8' },
  { id: 'star',    icon: '✦', color: '#F9A8D4' },
  { id: 'moon',    icon: '☽', color: '#C4A3DF' },
  { id: 'flower',  icon: '✿', color: '#F0ABFC' },
  { id: 'spark',   icon: '⚡', color: '#FCA5A5' },
  { id: 'diamond', icon: '◈', color: '#A5F3FC' },
];

function makeCards() {
  const pairs = [...SYMBOLS, ...SYMBOLS].map((s, i) => ({
    ...s,
    uid: `${s.id}-${i}`,
    flipped: false,
    matched: false,
  }));
  return pairs.sort(() => Math.random() - 0.5);
}

export function HeartmatchGame() {
  const [cards, setCards]     = useState(makeCards);
  const [selected, setSelected] = useState<string[]>([]);
  const [moves, setMoves]     = useState(0);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked]   = useState(false);
  const [won, setWon]         = useState(false);

  const flip = useCallback((uid: string) => {
    if (locked) return;
    const card = cards.find(c => c.uid === uid);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(uid)) return;

    const newSel = [...selected, uid];
    setCards(prev => prev.map(c => c.uid === uid ? { ...c, flipped: true } : c));
    setSelected(newSel);

    if (newSel.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = newSel.map(id => cards.find(c => c.uid === id)!);
      if (a.id === b.id) {
        setTimeout(() => {
          setCards(prev => prev.map(c => newSel.includes(c.uid) ? { ...c, matched: true } : c));
          setMatches(m => {
            if (m + 1 === SYMBOLS.length) setWon(true);
            return m + 1;
          });
          setSelected([]);
          setLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => newSel.includes(c.uid) ? { ...c, flipped: false } : c));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  }, [cards, selected, locked]);

  const reset = () => {
    setCards(makeCards());
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setLocked(false);
    setWon(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 50%, #1e0a38 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
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
          <div style={{ fontSize: 24, fontWeight: 900, color: '#EDB5F8', letterSpacing: -0.5 }}>heartmatch ♡</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>find every matching pair</div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px' }}>
          {[
            { label: 'matches', value: `${matches}/${SYMBOLS.length}` },
            { label: 'moves', value: moves },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 16,
              padding: '8px 12px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#EDB5F8' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Card grid */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {cards.map(card => (
            <button
              key={card.uid}
              onClick={() => flip(card.uid)}
              style={{
                aspectRatio: '1',
                borderRadius: 14,
                border: card.matched
                  ? `2px solid ${card.color}55`
                  : card.flipped
                    ? '2px solid rgba(255,255,255,0.25)'
                    : '2px solid rgba(255,255,255,0.1)',
                background: card.matched
                  ? `${card.color}22`
                  : card.flipped
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(255,255,255,0.07)',
                cursor: card.matched || card.flipped ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                transition: 'all 0.25s',
                boxShadow: card.matched ? `0 0 12px ${card.color}44` : 'none',
                transform: card.flipped && !card.matched ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              {(card.flipped || card.matched) ? (
                <span style={{ color: card.color }}>{card.icon}</span>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>✦</span>
              )}
            </button>
          ))}
        </div>

        {/* Won overlay */}
        {won && (
          <div style={{
            margin: '16px 16px 0',
            background: 'linear-gradient(135deg, rgba(237,181,248,0.2), rgba(196,163,223,0.2))',
            borderRadius: 20, padding: '16px', textAlign: 'center',
            border: '1.5px solid rgba(237,181,248,0.4)',
          }}>
            <div style={{ fontSize: 26 }}>🎉</div>
            <div style={{ color: '#EDB5F8', fontWeight: 800, fontSize: 16 }}>you matched them all!</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>in {moves} moves</div>
          </div>
        )}

        {/* Reset button */}
        <div style={{ padding: '14px 20px 24px' }}>
          <button onClick={reset} style={{
            width: '100%', padding: '13px', borderRadius: 18,
            background: 'linear-gradient(135deg, #EDB5F8, #C4A3DF)',
            border: 'none', color: '#1a0a2e', fontWeight: 800, fontSize: 14,
            cursor: 'pointer', letterSpacing: 0.5,
          }}>
            {won ? '♡  play again' : '↺  new game'}
          </button>
        </div>
      </div>
    </div>
  );
}
