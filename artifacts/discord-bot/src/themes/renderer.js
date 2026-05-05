/**
 * Theme background renderers.
 * Each function draws the full 800×600 background for its pattern type.
 */

const W = 800, H = 600;

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

// ── Deterministic PRNG (no Math.random so themes stay stable) ─────────────────
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── BLOBS (default lavender-style) ───────────────────────────────────────────
function renderBlobs(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(442, 72, 138, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(478, 116, 110, 0, Math.PI * 2); ctx.fill();

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

  ctx.fillStyle = t.blobFill2;
  ctx.beginPath();
  ctx.moveTo(18, 292);
  ctx.bezierCurveTo(-28, 260, -12, 218, 35, 244);
  ctx.bezierCurveTo(82, 270, 84, 335, 50, 365);
  ctx.bezierCurveTo(16, 395, -22, 375, -32, 342);
  ctx.bezierCurveTo(-42, 308, 18, 292, 18, 292);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(540, 240);
  ctx.bezierCurveTo(580, 268, 570, 310, 535, 305);
  ctx.bezierCurveTo(500, 300, 488, 260, 515, 250);
  ctx.stroke();
  ctx.restore();

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

  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(510, 830, 72, 0, Math.PI * 2); ctx.fill();

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

  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(478, 116, 88, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 4; ctx.lineCap = 'round';
  [[90, 760, 55], [500, 200, 40], [200, 30, 30]].forEach(([cx, cy, r]) => {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();

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

  smoothWave(ctx, 780, 30, 0.0,  t.blobFill2);
  smoothWave(ctx, 720, 28, 1.2,  t.blobFill);
  smoothWave(ctx, 660, 26, 2.5,  t.blobFill2);
  smoothWave(ctx, 820, 24, 0.8,  t.blobFill);

  ctx.save();
  ctx.translate(0, 0); ctx.scale(1, -1); ctx.translate(0, -H);
  smoothWave(ctx, H - 120, 28, 0.5, t.blobFill2);
  smoothWave(ctx, H - 175, 24, 1.8, t.blobFill);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 5.5; ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(0, 240);
  for (let x = 0; x <= W; x += 1) {
    ctx.lineTo(x, 240 + Math.sin((x / W) * Math.PI * 5 + 0.3) * 14);
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 655);
  for (let x = 0; x <= W; x += 1) {
    ctx.lineTo(x, 655 + Math.sin((x / W) * Math.PI * 5 + 1.1) * 14);
  }
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(442, 72, 90, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(480, 108, 68, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(510, 835, 58, 0, Math.PI * 2); ctx.fill();
}

// ── STARS (dark bg with glowing star field) ───────────────────────────────────
function renderStars(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  const rng = mulberry32(42);
  for (let i = 0; i < 160; i++) {
    const x = rng() * W;
    const y = rng() * H;
    const r = rng() * 2.2 + 0.4;
    const alpha = rng() * 0.6 + 0.4;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(440, 80, 120, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(480, 125, 95, 0, Math.PI * 2); ctx.fill();

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

// ── NEON ABYSS ── cyberpunk grid · plasma rings · glitch · electric void ──────
function renderNeon(ctx, t) {
  // Pure void base
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Scanlines (horizontal micro-lines for CRT effect)
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.022)';
    ctx.fillRect(0, y, W, 1);
  }

  // Perspective grid — vanishing point upper-center
  const vpX = W / 2, vpY = 90;
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.18)';
  ctx.lineWidth = 0.8;
  // Radial spokes from VP to bottom
  for (let i = 0; i <= 22; i++) {
    const bx = (W / 22) * i;
    ctx.beginPath();
    ctx.moveTo(vpX, vpY);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }
  // Horizontal "depth" lines with quadratic spacing
  for (let j = 1; j <= 18; j++) {
    const p = j / 18;
    const y = vpY + (H - vpY) * (p * p);
    ctx.beginPath();
    ctx.moveTo(0, y); ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.restore();

  // Cyan glow blob — top area ambient light
  const grd1 = ctx.createRadialGradient(450, 55, 0, 450, 55, 200);
  grd1.addColorStop(0, 'rgba(0, 255, 255, 0.32)');
  grd1.addColorStop(1, 'rgba(0, 255, 255, 0.00)');
  ctx.fillStyle = grd1;
  ctx.fillRect(0, 0, W, H);

  // Magenta glow blob — bottom left
  const grd2 = ctx.createRadialGradient(90, 820, 0, 90, 820, 160);
  grd2.addColorStop(0, 'rgba(255, 0, 255, 0.38)');
  grd2.addColorStop(1, 'rgba(255, 0, 255, 0.00)');
  ctx.fillStyle = grd2;
  ctx.fillRect(0, 0, W, H);

  // Bright cyan glow blob — mid right
  const grd3 = ctx.createRadialGradient(520, 420, 0, 520, 420, 110);
  grd3.addColorStop(0, 'rgba(0, 200, 255, 0.28)');
  grd3.addColorStop(1, 'rgba(0, 200, 255, 0.00)');
  ctx.fillStyle = grd3;
  ctx.fillRect(0, 0, W, H);

  // Concentric neon rings — cyan, centered mid-card
  const ringCX = W / 2, ringCY = H * 0.42;
  for (let ring = 0; ring < 5; ring++) {
    const r     = 90 + ring * 68;
    const alpha = Math.max(0.04, 0.32 - ring * 0.06);
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.lineWidth   = ring === 0 ? 3 : ring === 1 ? 2 : 1.2;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.9)';
    ctx.shadowBlur  = ring < 2 ? 18 : 8;
    ctx.beginPath(); ctx.arc(ringCX, ringCY, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Concentric magenta rings — offset center
  for (let ring = 0; ring < 4; ring++) {
    const r     = 65 + ring * 75;
    const alpha = Math.max(0.04, 0.26 - ring * 0.05);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
    ctx.lineWidth   = ring === 0 ? 2.5 : 1.2;
    ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
    ctx.shadowBlur  = ring < 2 ? 14 : 6;
    ctx.beginPath(); ctx.arc(W * 0.28, H * 0.28, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Glitch chromatic bars (3 random horizontal strips)
  const rng = mulberry32(77);
  for (let g = 0; g < 4; g++) {
    const gy = rng() * H;
    const gh = rng() * 3.5 + 0.8;
    ctx.fillStyle = `rgba(0, 255, 255, ${0.07 + rng() * 0.12})`;
    ctx.fillRect(0, gy, W, gh);
    ctx.fillStyle = `rgba(255, 0, 255, ${0.05 + rng() * 0.09})`;
    ctx.fillRect(2, gy + 0.6, W - 4, gh * 0.7);
    ctx.fillStyle = `rgba(255, 255, 0, ${0.03 + rng() * 0.06})`;
    ctx.fillRect(-1, gy + 0.3, W + 2, gh * 0.4);
  }

  // Scattered neon node particles
  const rng2 = mulberry32(33);
  for (let n = 0; n < 80; n++) {
    const nx    = rng2() * W;
    const ny    = rng2() * H;
    const nr    = rng2() * 1.8 + 0.3;
    const cyan  = rng2() > 0.45;
    const alpha = 0.45 + rng2() * 0.55;
    ctx.fillStyle = cyan
      ? `rgba(0, 255, 255, ${alpha})`
      : `rgba(255, 0, 255, ${alpha})`;
    ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fill();
  }

  // 4-point cross sparkles on brightest nodes
  const rng3 = mulberry32(55);
  for (let s = 0; s < 12; s++) {
    const sx   = rng3() * W;
    const sy   = rng3() * H;
    const sl   = 5 + rng3() * 9;
    const cyan = rng3() > 0.5;
    ctx.save();
    ctx.strokeStyle = cyan
      ? `rgba(0, 255, 255, ${0.5 + rng3() * 0.5})`
      : `rgba(255, 0, 255, ${0.5 + rng3() * 0.5})`;
    ctx.lineWidth   = 0.8;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur  = 6;
    ctx.beginPath();
    ctx.moveTo(sx - sl, sy); ctx.lineTo(sx + sl, sy);
    ctx.moveTo(sx, sy - sl); ctx.lineTo(sx, sy + sl);
    ctx.stroke();
    ctx.restore();
  }

  // Electric arc lines (neon lightning-style strokes)
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.70)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0, 255, 255, 1.0)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.bezierCurveTo(80, 285, 120, 340, 190, 320);
  ctx.bezierCurveTo(260, 300, 280, 355, 350, 335);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 0, 255, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(255, 0, 255, 1.0)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(W, 580);
  ctx.bezierCurveTo(W - 70, 560, W - 130, 610, W - 200, 590);
  ctx.bezierCurveTo(W - 270, 570, W - 290, 625, W - 360, 605);
  ctx.stroke();
  ctx.restore();

  // Corner accent triangles
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.40)';
  ctx.lineWidth = 1;
  // Top-left corner bracket
  ctx.beginPath();
  ctx.moveTo(20, 50); ctx.lineTo(20, 20); ctx.lineTo(50, 20);
  ctx.stroke();
  // Bottom-right corner bracket
  ctx.beginPath();
  ctx.moveTo(W - 20, H - 50); ctx.lineTo(W - 20, H - 20); ctx.lineTo(W - 50, H - 20);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 0, 255, 0.40)';
  // Top-right corner bracket
  ctx.beginPath();
  ctx.moveTo(W - 20, 50); ctx.lineTo(W - 20, 20); ctx.lineTo(W - 50, 20);
  ctx.stroke();
  // Bottom-left corner bracket
  ctx.beginPath();
  ctx.moveTo(20, H - 50); ctx.lineTo(20, H - 20); ctx.lineTo(50, H - 20);
  ctx.stroke();
  ctx.restore();
}

// ── CRIMSON ECLIPSE ── solar corona · orbital rings · plasma arcs · embers ───
function renderCrimson(ctx, t) {
  // Deep void base
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Atmospheric base gradient (dark red ground glow)
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0,   'rgba(30, 0, 5, 0.0)');
  base.addColorStop(0.5, 'rgba(80, 5, 10, 0.35)');
  base.addColorStop(1,   'rgba(15, 0, 3, 0.0)');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // Primary corona burst (off-center sun peek)
  const sunX = W * 0.63, sunY = H * 0.37;
  const corona1 = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 340);
  corona1.addColorStop(0,    'rgba(255, 120, 20, 0.55)');
  corona1.addColorStop(0.25, 'rgba(255, 60, 10, 0.38)');
  corona1.addColorStop(0.60, 'rgba(200, 20, 5, 0.18)');
  corona1.addColorStop(1,    'rgba(200, 20, 5, 0.00)');
  ctx.fillStyle = corona1;
  ctx.fillRect(0, 0, W, H);

  // Inner hot corona
  const corona2 = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 150);
  corona2.addColorStop(0,    'rgba(255, 220, 80, 0.65)');
  corona2.addColorStop(0.4,  'rgba(255, 100, 20, 0.45)');
  corona2.addColorStop(1,    'rgba(255, 50, 10, 0.00)');
  ctx.fillStyle = corona2;
  ctx.fillRect(0, 0, W, H);

  // Secondary cool corona (bottom left counterpoint)
  const corona3 = ctx.createRadialGradient(W * 0.14, H * 0.73, 0, W * 0.14, H * 0.73, 200);
  corona3.addColorStop(0,   'rgba(180, 10, 35, 0.45)');
  corona3.addColorStop(0.5, 'rgba(140, 5, 20, 0.22)');
  corona3.addColorStop(1,   'rgba(140, 5, 20, 0.00)');
  ctx.fillStyle = corona3;
  ctx.fillRect(0, 0, W, H);

  // Eclipse moon disc — dark circle cutting the corona
  const moonDisc = ctx.createRadialGradient(sunX - 8, sunY - 8, 0, sunX, sunY, 82);
  moonDisc.addColorStop(0,   'rgba(6, 0, 2, 1.00)');
  moonDisc.addColorStop(0.75,'rgba(6, 0, 2, 0.92)');
  moonDisc.addColorStop(1,   'rgba(6, 0, 2, 0.00)');
  ctx.fillStyle = moonDisc;
  ctx.beginPath(); ctx.arc(sunX, sunY, 82, 0, Math.PI * 2); ctx.fill();

  // Orbital rings at different angles
  const orbits = [
    { rx: 175, ry: 52,  angle: -0.35, alpha: 0.50, lw: 1.8, color: [255, 90, 20]  },
    { rx: 240, ry: 75,  angle:  0.18, alpha: 0.35, lw: 1.3, color: [255, 50, 10]  },
    { rx: 310, ry: 100, angle: -0.65, alpha: 0.25, lw: 1.0, color: [180, 20, 5]   },
    { rx: 390, ry: 120, angle:  0.42, alpha: 0.15, lw: 0.8, color: [140, 10, 5]   },
  ];
  for (const o of orbits) {
    ctx.save();
    ctx.translate(sunX, sunY);
    ctx.rotate(o.angle);
    ctx.strokeStyle = `rgba(${o.color[0]}, ${o.color[1]}, ${o.color[2]}, ${o.alpha})`;
    ctx.lineWidth   = o.lw;
    ctx.shadowColor = `rgba(${o.color[0]}, ${o.color[1]}, ${o.color[2]}, 0.7)`;
    ctx.shadowBlur  = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Plasma arc strokes — bright curved tendrils
  const arcs = [
    { pts: [[W * 0.82, H * 0.03], [W * 0.97, H * 0.22], [W * 0.88, H * 0.52], [W * 0.72, H * 0.66]], lw: 2.8, color: 'rgba(255, 130, 30, 0.85)' },
    { pts: [[W * 0.03, H * 0.78], [W * 0.16, H * 0.60], [W * 0.28, H * 0.57], [W * 0.32, H * 0.72]], lw: 2.0, color: 'rgba(255, 90, 20, 0.70)' },
    { pts: [[W * 0.42, H * 0.08], [W * 0.22, H * 0.18], [W * 0.14, H * 0.38], [W * 0.26, H * 0.50]], lw: 1.8, color: 'rgba(255, 160, 40, 0.65)' },
    { pts: [[W * 0.55, H * 0.88], [W * 0.68, H * 0.80], [W * 0.78, H * 0.82], [W * 0.88, H * 0.75]], lw: 1.5, color: 'rgba(255, 80, 10, 0.55)' },
  ];
  for (const a of arcs) {
    ctx.save();
    ctx.strokeStyle = a.color;
    ctx.lineWidth   = a.lw;
    ctx.lineCap     = 'round';
    ctx.shadowColor = 'rgba(255, 100, 20, 0.9)';
    ctx.shadowBlur  = 16;
    ctx.beginPath();
    ctx.moveTo(a.pts[0][0], a.pts[0][1]);
    ctx.bezierCurveTo(a.pts[1][0], a.pts[1][1], a.pts[2][0], a.pts[2][1], a.pts[3][0], a.pts[3][1]);
    ctx.stroke();
    ctx.restore();
  }

  // Ember / hot particle field
  const rng = mulberry32(123);
  for (let e = 0; e < 100; e++) {
    const ex    = rng() * W;
    const ey    = rng() * H;
    const er    = rng() * 2.2 + 0.25;
    const warm  = rng();
    let color;
    if      (warm > 0.72) color = `rgba(255, 220, 70,  ${0.55 + rng() * 0.45})`;
    else if (warm > 0.44) color = `rgba(255, 110, 20,  ${0.45 + rng() * 0.45})`;
    else                   color = `rgba(210,  15, 20,  ${0.35 + rng() * 0.45})`;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI * 2); ctx.fill();
  }

  // 4-point ember sparkles (brighter particles)
  const rng2 = mulberry32(77);
  for (let s = 0; s < 10; s++) {
    const sx  = rng2() * W;
    const sy  = rng2() * H;
    const sl  = 4 + rng2() * 8;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 200, 60, ${0.55 + rng2() * 0.45})`;
    ctx.lineWidth   = 0.9;
    ctx.shadowColor = 'rgba(255, 180, 40, 0.9)';
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(sx - sl, sy); ctx.lineTo(sx + sl, sy);
    ctx.moveTo(sx, sy - sl); ctx.lineTo(sx, sy + sl);
    ctx.stroke();
    ctx.restore();
  }

  // Dark vignette at edges
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.95);
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0.00)');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.60)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
}

// ── GALAXY (deep cosmic — shimmer particles + nebula blobs) ──────────────────
function renderGalaxy(ctx, t) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

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
      ctx.fillStyle = `rgba(255, 255, 200, ${(alpha * 0.5).toFixed(2)})`;
      ctx.fillRect(x - r * 3, y - 0.5, r * 6, 1);
      ctx.fillRect(x - 0.5, y - r * 3, 1, r * 6);
    }
  }

  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(440, 80, 125, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(478, 122, 98, 0, Math.PI * 2); ctx.fill();

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

// ── Public dispatcher ─────────────────────────────────────────────────────────
export function renderBackground(ctx, theme) {
  switch (theme.pattern) {
    case 'bubbles': return renderBubbles(ctx, theme);
    case 'waves':   return renderWaves(ctx, theme);
    case 'stars':   return renderStars(ctx, theme);
    case 'galaxy':  return renderGalaxy(ctx, theme);
    case 'neon':    return renderNeon(ctx, theme);
    case 'crimson': return renderCrimson(ctx, theme);
    default:        return renderBlobs(ctx, theme);
  }
}
