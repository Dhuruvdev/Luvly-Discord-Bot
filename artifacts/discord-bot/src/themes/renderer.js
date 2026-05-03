/**
 * Theme background renderers.
 * Each function draws the full 580×900 background for its pattern type.
 */

const W = 580, H = 900;

// ── Shared helpers ────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── BLOBS (default lavender-style) ───────────────────────────────────────────
function renderBlobs(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Large circle top-right + crescent
  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(442, 72, 138, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(478, 116, 110, 0, Math.PI * 2); ctx.fill();

  // Double squiggles top-left
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 218);
  ctx.bezierCurveTo(0, 138, 26, 88, 68, 108);
  ctx.bezierCurveTo(110, 128, 114, 182, 82, 220);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 230);
  ctx.bezierCurveTo(46, 150, 75, 98, 118, 118);
  ctx.bezierCurveTo(162, 138, 165, 194, 132, 232);
  ctx.stroke();
  ctx.restore();

  // Centre-left tear-drop blob
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath();
  ctx.moveTo(18, 292);
  ctx.bezierCurveTo(-28, 260, -12, 218, 35, 244);
  ctx.bezierCurveTo(82, 270, 84, 335, 50, 365);
  ctx.bezierCurveTo(16, 395, -22, 375, -32, 342);
  ctx.bezierCurveTo(-42, 308, 18, 292, 18, 292);
  ctx.fill();

  // Mid-right small squiggle
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(540, 240);
  ctx.bezierCurveTo(580, 268, 570, 310, 535, 305);
  ctx.bezierCurveTo(500, 300, 488, 260, 515, 250);
  ctx.stroke();
  ctx.restore();

  // Bottom-left flourish
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(88, 900);
  ctx.bezierCurveTo(50, 860, 8, 810, 28, 768);
  ctx.bezierCurveTo(48, 726, 100, 728, 132, 765);
  ctx.bezierCurveTo(164, 802, 162, 856, 138, 892);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(138, 892);
  ctx.bezierCurveTo(118, 928, 72, 934, 55, 905);
  ctx.bezierCurveTo(38, 876, 62, 854, 88, 868);
  ctx.stroke();
  ctx.restore();

  // Bottom-right blob
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(510, 830, 72, 0, Math.PI * 2); ctx.fill();

  // Accent dots
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(28, 110, 22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(560, 680, 18, 0, Math.PI * 2); ctx.fill();
}

// ── BUBBLES ───────────────────────────────────────────────────────────────────
function renderBubbles(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  const circles = [
    [450, 80, 110], [380, 40, 55], [60, 80, 45],
    [510, 820, 80], [40, 800, 50], [540, 450, 38],
    [10, 500, 60], [290, 20, 35], [520, 280, 28],
    [30, 340, 32], [550, 600, 42], [180, 870, 40],
  ];
  circles.forEach(([cx, cy, r], i) => {
    ctx.fillStyle = i % 2 === 0 ? t.blobFill : t.blobFill2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  });

  // Crescent on top-right
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(478, 116, 88, 0, Math.PI * 2); ctx.fill();

  // Decorative rings (outline circles)
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 4; ctx.lineCap = 'round';
  [[90, 760, 55], [500, 200, 40], [200, 30, 30]].forEach(([cx, cy, r]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();

  // Squiggly accent line
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 6.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(30, 220); ctx.bezierCurveTo(5, 145, 32, 95, 72, 115);
  ctx.bezierCurveTo(112, 135, 115, 185, 84, 222);
  ctx.stroke();
  ctx.restore();
}

// ── WAVES ─────────────────────────────────────────────────────────────────────
function smoothWave(ctx, y, amp, phaseOffset, fillColor) {
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, y);
  // Smooth sine using small steps
  for (let x = 0; x <= W; x += 1) {
    const wy = y + Math.sin((x / W) * Math.PI * 4 + phaseOffset) * amp;
    ctx.lineTo(x, wy);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function renderWaves(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Layered wave "hills" from bottom up — creates a calm layered landscape
  smoothWave(ctx, 780, 30, 0.0,  t.blobFill2);
  smoothWave(ctx, 720, 28, 1.2,  t.blobFill);
  smoothWave(ctx, 660, 26, 2.5,  t.blobFill2);
  smoothWave(ctx, 820, 24, 0.8,  t.blobFill);

  // Upper decorative waves (mirrored from top)
  ctx.save();
  ctx.translate(0, 0); ctx.scale(1, -1); ctx.translate(0, -H);
  smoothWave(ctx, H - 120, 28, 0.5, t.blobFill2);
  smoothWave(ctx, H - 175, 24, 1.8, t.blobFill);
  ctx.restore();

  // Squiggle accent strokes
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 5.5; ctx.lineCap = 'round';

  // Gentle horizontal wavy stroke (top area)
  ctx.beginPath();
  ctx.moveTo(0, 240);
  for (let x = 0; x <= W; x += 1) {
    ctx.lineTo(x, 240 + Math.sin((x / W) * Math.PI * 5 + 0.3) * 14);
  }
  ctx.stroke();

  // Gentle horizontal wavy stroke (bottom area)
  ctx.beginPath();
  ctx.moveTo(0, 655);
  for (let x = 0; x <= W; x += 1) {
    ctx.lineTo(x, 655 + Math.sin((x / W) * Math.PI * 5 + 1.1) * 14);
  }
  ctx.stroke();
  ctx.restore();

  // Circle + crescent accent top-right
  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(442, 72, 90, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(480, 108, 68, 0, Math.PI * 2); ctx.fill();

  // Bottom-right blob
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(510, 835, 58, 0, Math.PI * 2); ctx.fill();
}

// ── STARS (Midnight-style dark bg with light dots) ───────────────────────────
function renderStars(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Star field
  const rng = mulberry32(42);
  for (let i = 0; i < 160; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = rng() * 2.2 + 0.4;
    const alpha = rng() * 0.6 + 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Glowing blobs
  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(440, 80, 120, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(480, 125, 95, 0, Math.PI * 2); ctx.fill();

  // Squiggles (bright on dark)
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 218); ctx.bezierCurveTo(0, 138, 26, 88, 68, 108);
  ctx.bezierCurveTo(110, 128, 114, 182, 82, 220);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 230); ctx.bezierCurveTo(46, 150, 75, 98, 118, 118);
  ctx.bezierCurveTo(162, 138, 165, 194, 132, 232);
  ctx.stroke();
  ctx.restore();

  // Bottom blob + flourish
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(510, 830, 70, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(88, 900); ctx.bezierCurveTo(50, 860, 8, 810, 28, 768);
  ctx.bezierCurveTo(48, 726, 100, 728, 132, 765);
  ctx.bezierCurveTo(164, 802, 162, 856, 138, 892);
  ctx.stroke();
  ctx.restore();
}

// ── GALAXY (deep cosmic — shimmer particles + nebula blobs) ──────────────────
function renderGalaxy(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Nebula gradient overlays
  const nebula1 = ctx.createRadialGradient(350, 200, 0, 350, 200, 250);
  nebula1.addColorStop(0, 'rgba(120, 50, 220, 0.40)');
  nebula1.addColorStop(1, 'rgba(120, 50, 220, 0.00)');
  ctx.fillStyle = nebula1;
  ctx.fillRect(0, 0, W, H);

  const nebula2 = ctx.createRadialGradient(100, 650, 0, 100, 650, 200);
  nebula2.addColorStop(0, 'rgba(40, 10, 160, 0.45)');
  nebula2.addColorStop(1, 'rgba(40, 10, 160, 0.00)');
  ctx.fillStyle = nebula2;
  ctx.fillRect(0, 0, W, H);

  // Star field (denser, more sparkle)
  const rng = mulberry32(99);
  for (let i = 0; i < 220; i++) {
    const x = rng() * W, y = rng() * H;
    const r = rng() * 2.5 + 0.3;
    const alpha = rng() * 0.7 + 0.3;
    const bright = rng() > 0.85;
    ctx.fillStyle = bright
      ? `rgba(255, 240, 180, ${alpha.toFixed(2)})`
      : `rgba(220, 200, 255, ${alpha.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (bright && r > 1.5) {
      // 4-point star cross
      ctx.fillStyle = `rgba(255, 255, 200, ${(alpha * 0.5).toFixed(2)})`;
      ctx.fillRect(x - r * 3, y - 0.5, r * 6, 1);
      ctx.fillRect(x - 0.5, y - r * 3, 1, r * 6);
    }
  }

  // Glowing blobs
  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(440, 80, 125, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(478, 122, 98, 0, Math.PI * 2); ctx.fill();

  // Squiggles
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(24, 218); ctx.bezierCurveTo(0, 138, 26, 88, 68, 108);
  ctx.bezierCurveTo(110, 128, 114, 182, 82, 220);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(70, 230); ctx.bezierCurveTo(46, 150, 75, 98, 118, 118);
  ctx.bezierCurveTo(162, 138, 165, 194, 132, 232);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(510, 830, 70, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(28, 110, 22, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(88, 900); ctx.bezierCurveTo(50, 860, 8, 810, 28, 768);
  ctx.bezierCurveTo(48, 726, 100, 728, 132, 765);
  ctx.bezierCurveTo(164, 802, 162, 856, 138, 892);
  ctx.stroke();
  ctx.restore();
}

// ── Deterministic PRNG (no Math.random so themes stay stable) ─────────────────
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Public dispatcher ─────────────────────────────────────────────────────────
export function renderBackground(ctx, theme) {
  switch (theme.pattern) {
    case 'bubbles': return renderBubbles(ctx, theme);
    case 'waves':   return renderWaves(ctx, theme);
    case 'stars':   return renderStars(ctx, theme);
    case 'galaxy':  return renderGalaxy(ctx, theme);
    default:        return renderBlobs(ctx, theme);
  }
}
