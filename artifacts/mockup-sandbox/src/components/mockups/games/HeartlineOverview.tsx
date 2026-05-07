export function HeartlineOverview() {
  const findings = [
    { icon: '⚡', stat: 'June 30, 2025', label: 'Gartic Phone left Discord Activities', sub: 'Biggest social party game vacancy in 3 years — gap is open now' },
    { icon: '📱', stat: '7×', label: 'more playtime when friends join', sub: 'Discord data: sessions increase 7× with even one friend present' },
    { icon: '🎯', stat: '#1 formula', label: 'Jackbox viral secret', sub: 'Your friend group IS the content — games just deliver the moment' },
    { icon: '💜', stat: '0 competitors', label: 'romance party games on Discord', sub: 'Zero dedicated love/vibe themed party games exist in the space' },
    { icon: '🌊', stat: 'TikTok trend', label: '"aura points" viral 2023–2025', sub: 'Gen Z already speaks the language Luvly was built around' },
  ];

  const mechanics = [
    { step: '01', title: 'Hot Seat', desc: 'One server member is spotlighted each round — everyone knows them' },
    { step: '02', title: 'The Read', desc: 'All players privately submit ONE word for that person\'s vibe (anonymous)' },
    { step: '03', title: 'The Board', desc: 'All words appear at once — a beautiful scatter board, no names attached yet' },
    { step: '04', title: 'Sign Your Read', desc: 'Risk/reward: claim your word publicly for bonus chemistry points' },
    { step: '05', title: 'The Truth', desc: 'Hot Seat picks the word that hits hardest — that player earns chemistry' },
    { step: '06', title: 'Drop', desc: 'Chemistry score updates in the bot — board is screenshotted & posted to server' },
  ];

  const vs = [
    { game: 'Gartic Phone', why: 'Drawing skill = barrier. Heartline = one word, zero skill gate' },
    { game: 'Magic Circle', why: 'Generic trivia about friends. Heartline = romance/vibe reads, Luvly native' },
    { game: 'Aura Quiz', why: 'Self-assessment quiz. Heartline = OTHER PEOPLE read YOU — more drama' },
    { game: 'Word Rizz', why: 'Solo puzzle. Heartline = 3–25 players, real drama, real stakes' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0d0618 0%, #1a0a2e 40%, #0f0520 100%)',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      color: '#fff',
      padding: '40px',
      boxSizing: 'border-box',
    }}>

      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 8 }}>
          research-backed game concept · may 2026
        </div>
        <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1 }}>
          <span style={{ color: '#EDB5F8' }}>heartline</span>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 24, fontWeight: 400, marginLeft: 16 }}>by luvly</span>
        </div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginTop: 10, maxWidth: 600, lineHeight: 1.6 }}>
          A Jackbox-style social party game where your server reads your aura — and chemistry is earned, not given.
        </div>

        <div style={{
          display: 'inline-block', marginTop: 14, padding: '8px 18px',
          background: 'linear-gradient(135deg, rgba(237,181,248,0.2), rgba(196,163,223,0.1))',
          borderRadius: 99, border: '1.5px solid rgba(237,181,248,0.4)',
          fontSize: 13, fontWeight: 700, color: '#EDB5F8',
        }}>
          ✦ one-sentence pitch: "everyone guesses your vibe with one word — whoever reads you best earns chemistry"
        </div>
      </div>

      {/* Research findings */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 14 }}>
          why now — research findings
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {findings.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '16px 14px',
            }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#EDB5F8', marginBottom: 2 }}>{f.stat}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6, lineHeight: 1.3 }}>{f.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it plays */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 14 }}>
          how it plays — 6 steps
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {mechanics.map((m, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 16, padding: '18px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                minWidth: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(237,181,248,0.25), rgba(196,163,223,0.15))',
                border: '1px solid rgba(237,181,248,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 900, color: '#EDB5F8',
              }}>{m.step}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Why not others */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 14 }}>
          why heartline beats the alternatives
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vs.map((v, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                minWidth: 100, fontSize: 12, fontWeight: 700,
                color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through',
              }}>{v.game}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>→ {v.why}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Viral loop */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(237,181,248,0.1), rgba(196,163,223,0.06))',
        border: '1.5px solid rgba(237,181,248,0.25)',
        borderRadius: 20, padding: '22px 26px',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#C4A3DF', textTransform: 'uppercase', marginBottom: 12 }}>
          viral loop
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[
            'Play in server',
            '→',
            'Reveal board screenshot',
            '→',
            '"look what my friends said about me" post',
            '→',
            'New users join server',
            '→',
            'They discover Luvly bot',
            '→',
            'Play again',
          ].map((item, i) => (
            <span key={i} style={{
              fontSize: item === '→' ? 16 : 12,
              color: item === '→' ? 'rgba(255,255,255,0.25)' : '#EDB5F8',
              fontWeight: item === '→' ? 400 : 700,
              background: item === '→' ? 'none' : 'rgba(237,181,248,0.1)',
              borderRadius: item === '→' ? 0 : 99,
              padding: item === '→' ? 0 : '4px 12px',
              border: item === '→' ? 'none' : '1px solid rgba(237,181,248,0.2)',
            }}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
