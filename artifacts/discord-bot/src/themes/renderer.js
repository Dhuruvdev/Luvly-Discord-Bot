/**
 * Theme background renderers.
 * Each function draws the full W×H background for its pattern type.
 * W and H are passed in from the card generator so the renderer
 * is not hard-coded to any canvas size.
 */

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

// ── Deterministic PRNG ────────────────────────────────────────────────────────
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── BLOBS ─────────────────────────────────────────────────────────────────────
function renderBlobs(ctx, t, W, H) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // Top-right blob
  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(W * 0.80, H * 0.18, W * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(W * 0.86, H * 0.34, W * 0.13, 0, Math.PI * 2); ctx.fill();

  // Left squiggles
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.028, H * 0.52);
  ctx.bezierCurveTo(W * 0.00, H * 0.32, W * 0.03, H * 0.20, W * 0.08, H * 0.26);
  ctx.bezierCurveTo(W * 0.13, H * 0.32, W * 0.13, H * 0.46, W * 0.09, H * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.082, H * 0.58);
  ctx.bezierCurveTo(W * 0.05, H * 0.38, W * 0.09, H * 0.24, W * 0.14, H * 0.30);
  ctx.bezierCurveTo(W * 0.19, H * 0.36, W * 0.19, H * 0.50, W * 0.15, H * 0.59);
  ctx.stroke();
  ctx.restore();

  // Blob mid-left
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath();
  ctx.moveTo(W * 0.022, H * 0.72);
  ctx.bezierCurveTo(-W * 0.02, H * 0.64, -W * 0.01, H * 0.54, W * 0.04, H * 0.60);
  ctx.bezierCurveTo(W * 0.09, H * 0.66, W * 0.09, H * 0.82, W * 0.06, H * 0.90);
  ctx.bezierCurveTo(W * 0.02, H * 0.98, -W * 0.02, H * 0.94, -W * 0.03, H * 0.86);
  ctx.bezierCurveTo(-W * 0.04, H * 0.78, W * 0.022, H * 0.72, W * 0.022, H * 0.72);
  ctx.fill();

  // Small accent circles
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(W * 0.033, H * 0.18, W * 0.027, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.69, H * 0.82, W * 0.022, 0, Math.PI * 2); ctx.fill();

  // Bottom-right squiggle ring
  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.64, H * 0.62);
  ctx.bezierCurveTo(W * 0.68, H * 0.70, W * 0.67, H * 0.80, W * 0.63, H * 0.78);
  ctx.bezierCurveTo(W * 0.59, H * 0.76, W * 0.58, H * 0.66, W * 0.62, H * 0.64);
  ctx.stroke();
  ctx.restore();

  // Bottom blob
  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(W * 0.63, H * 0.95, W * 0.09, 0, Math.PI * 2); ctx.fill();
}

// ── BUBBLES ───────────────────────────────────────────────────────────────────
function renderBubbles(ctx, t, W, H) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  const circles = [
    [0.50, 0.18, 0.13], [0.42, 0.08, 0.07], [0.06, 0.18, 0.055],
    [0.58, 0.88, 0.10], [0.05, 0.88, 0.06], [0.60, 0.52, 0.046],
    [0.01, 0.55, 0.07], [0.32, 0.05, 0.042], [0.58, 0.32, 0.034],
    [0.03, 0.40, 0.038], [0.62, 0.72, 0.050], [0.20, 0.95, 0.048],
  ];
  circles.forEach(([rx, ry, rr], i) => {
    ctx.fillStyle = i % 2 === 0 ? t.blobFill : t.blobFill2;
    ctx.beginPath(); ctx.arc(rx * W, ry * H, rr * W, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(W * 0.54, H * 0.30, W * 0.11, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 4; ctx.lineCap = 'round';
  [[0.10, 0.85, 0.07], [0.56, 0.22, 0.05], [0.22, 0.06, 0.037]].forEach(([rx, ry, rr]) => {
    ctx.beginPath(); ctx.arc(rx * W, ry * H, rr * W, 0, Math.PI * 2); ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(W * 0.033, H * 0.52);
  ctx.bezierCurveTo(W * 0.006, H * 0.36, W * 0.037, H * 0.23, W * 0.082, H * 0.28);
  ctx.bezierCurveTo(W * 0.128, H * 0.34, W * 0.130, H * 0.46, W * 0.096, H * 0.55);
  ctx.stroke();
  ctx.restore();
}

// ── WAVES ─────────────────────────────────────────────────────────────────────
function smoothWave(ctx, W, H, yFrac, amp, phaseOffset, fillColor) {
  const y = yFrac * H;
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

function renderWaves(ctx, t, W, H) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  smoothWave(ctx, W, H, 1.30, 30, 0.0, t.blobFill2);
  smoothWave(ctx, W, H, 1.20, 28, 1.2, t.blobFill);
  smoothWave(ctx, W, H, 1.10, 26, 2.5, t.blobFill2);
  smoothWave(ctx, W, H, 1.38, 24, 0.8, t.blobFill);

  ctx.save();
  ctx.translate(0, 0); ctx.scale(1, -1); ctx.translate(0, -H);
  smoothWave(ctx, W, H, 0.80, 28, 0.5, t.blobFill2);
  smoothWave(ctx, W, H, 0.72, 24, 1.8, t.blobFill);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = t.squigColor;
  ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.42);
  for (let x = 0; x <= W; x += 1) {
    ctx.lineTo(x, H * 0.42 + Math.sin((x / W) * Math.PI * 5 + 0.3) * 14);
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, H * 0.72);
  for (let x = 0; x <= W; x += 1) {
    ctx.lineTo(x, H * 0.72 + Math.sin((x / W) * Math.PI * 5 + 1.1) * 14);
  }
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = t.blobFill;
  ctx.beginPath(); ctx.arc(W * 0.80, H * 0.18, W * 0.10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = t.bg;
  ctx.beginPath(); ctx.arc(W * 0.86, H * 0.30, W * 0.076, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = t.blobFill2;
  ctx.beginPath(); ctx.arc(W * 0.62, H * 0.92, W * 0.065, 0, Math.PI * 2); ctx.fill();
}

// ── NEON ABYSS ────────────────────────────────────────────────────────────────
function renderNeon(ctx, t, W, H) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = 'rgba(0, 255, 255, 0.022)';
    ctx.fillRect(0, y, W, 1);
  }

  const vpX = W / 2, vpY = H * 0.22;
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.18)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i <= 22; i++) {
    const bx = (W / 22) * i;
    ctx.beginPath(); ctx.moveTo(vpX, vpY); ctx.lineTo(bx, H); ctx.stroke();
  }
  for (let j = 1; j <= 14; j++) {
    const p = j / 14;
    const y = vpY + (H - vpY) * (p * p);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  const grd1 = ctx.createRadialGradient(W * 0.50, H * 0.14, 0, W * 0.50, H * 0.14, W * 0.22);
  grd1.addColorStop(0, 'rgba(0, 255, 255, 0.32)');
  grd1.addColorStop(1, 'rgba(0, 255, 255, 0.00)');
  ctx.fillStyle = grd1; ctx.fillRect(0, 0, W, H);

  const grd2 = ctx.createRadialGradient(W * 0.10, H * 0.88, 0, W * 0.10, H * 0.88, W * 0.18);
  grd2.addColorStop(0, 'rgba(255, 0, 255, 0.38)');
  grd2.addColorStop(1, 'rgba(255, 0, 255, 0.00)');
  ctx.fillStyle = grd2; ctx.fillRect(0, 0, W, H);

  const grd3 = ctx.createRadialGradient(W * 0.58, H * 0.55, 0, W * 0.58, H * 0.55, W * 0.12);
  grd3.addColorStop(0, 'rgba(0, 200, 255, 0.28)');
  grd3.addColorStop(1, 'rgba(0, 200, 255, 0.00)');
  ctx.fillStyle = grd3; ctx.fillRect(0, 0, W, H);

  const ringCX = W / 2, ringCY = H * 0.50;
  for (let ring = 0; ring < 5; ring++) {
    const r = W * 0.10 + ring * W * 0.076;
    const alpha = Math.max(0.04, 0.32 - ring * 0.06);
    ctx.save();
    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
    ctx.lineWidth   = ring < 2 ? 2.5 : 1.2;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.9)'; ctx.shadowBlur = ring < 2 ? 18 : 8;
    ctx.beginPath(); ctx.arc(ringCX, ringCY, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  for (let ring = 0; ring < 4; ring++) {
    const r = W * 0.07 + ring * W * 0.084;
    const alpha = Math.max(0.04, 0.26 - ring * 0.05);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
    ctx.lineWidth   = ring === 0 ? 2.5 : 1.2;
    ctx.shadowColor = 'rgba(255, 0, 255, 0.8)'; ctx.shadowBlur = ring < 2 ? 14 : 6;
    ctx.beginPath(); ctx.arc(W * 0.28, H * 0.32, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  const rng = mulberry32(77);
  for (let g = 0; g < 4; g++) {
    const gy = rng() * H; const gh = rng() * 3.5 + 0.8;
    ctx.fillStyle = `rgba(0, 255, 255, ${0.07 + rng() * 0.12})`; ctx.fillRect(0, gy, W, gh);
    ctx.fillStyle = `rgba(255, 0, 255, ${0.05 + rng() * 0.09})`; ctx.fillRect(2, gy + 0.6, W - 4, gh * 0.7);
    ctx.fillStyle = `rgba(255, 255, 0, ${0.03 + rng() * 0.06})`; ctx.fillRect(-1, gy + 0.3, W + 2, gh * 0.4);
  }

  const rng2 = mulberry32(33);
  for (let n = 0; n < 80; n++) {
    const nx = rng2() * W, ny = rng2() * H, nr = rng2() * 1.8 + 0.3;
    const cyan = rng2() > 0.45, alpha = 0.45 + rng2() * 0.55;
    ctx.fillStyle = cyan ? `rgba(0, 255, 255, ${alpha})` : `rgba(255, 0, 255, ${alpha})`;
    ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2); ctx.fill();
  }

  const rng3 = mulberry32(55);
  for (let s = 0; s < 12; s++) {
    const sx = rng3() * W, sy = rng3() * H, sl = 5 + rng3() * 9, cyan = rng3() > 0.5;
    ctx.save();
    ctx.strokeStyle = cyan ? `rgba(0,255,255,${0.5+rng3()*0.5})` : `rgba(255,0,255,${0.5+rng3()*0.5})`;
    ctx.lineWidth = 0.8; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(sx-sl,sy); ctx.lineTo(sx+sl,sy); ctx.moveTo(sx,sy-sl); ctx.lineTo(sx,sy+sl);
    ctx.stroke(); ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,255,0.70)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0,255,255,1.0)'; ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.52);
  ctx.bezierCurveTo(W*0.09, H*0.48, W*0.13, H*0.57, W*0.21, H*0.54);
  ctx.bezierCurveTo(W*0.29, H*0.51, W*0.31, H*0.59, W*0.39, H*0.56);
  ctx.stroke(); ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,0,255,0.65)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(255,0,255,1.0)'; ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(W, H*0.72);
  ctx.bezierCurveTo(W*0.92, H*0.68, W*0.86, H*0.76, W*0.78, H*0.73);
  ctx.bezierCurveTo(W*0.70, H*0.70, W*0.68, H*0.78, W*0.60, H*0.75);
  ctx.stroke(); ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,255,0.40)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20,50); ctx.lineTo(20,20); ctx.lineTo(50,20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W-20,H-50); ctx.lineTo(W-20,H-20); ctx.lineTo(W-50,H-20); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,0,255,0.40)';
  ctx.beginPath(); ctx.moveTo(W-20,50); ctx.lineTo(W-20,20); ctx.lineTo(W-50,20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(20,H-50); ctx.lineTo(20,H-20); ctx.lineTo(50,H-20); ctx.stroke();
  ctx.restore();
}

// ── CRIMSON ECLIPSE ───────────────────────────────────────────────────────────
function renderCrimson(ctx, t, W, H) {
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0,   'rgba(30,0,5,0.0)');
  base.addColorStop(0.5, 'rgba(80,5,10,0.35)');
  base.addColorStop(1,   'rgba(15,0,3,0.0)');
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);

  const sunX = W * 0.63, sunY = H * 0.37;
  const corona1 = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.38);
  corona1.addColorStop(0,    'rgba(255,120,20,0.55)');
  corona1.addColorStop(0.25, 'rgba(255,60,10,0.38)');
  corona1.addColorStop(0.60, 'rgba(200,20,5,0.18)');
  corona1.addColorStop(1,    'rgba(200,20,5,0.00)');
  ctx.fillStyle = corona1; ctx.fillRect(0, 0, W, H);

  const corona2 = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, W * 0.17);
  corona2.addColorStop(0,   'rgba(255,220,80,0.65)');
  corona2.addColorStop(0.4, 'rgba(255,100,20,0.45)');
  corona2.addColorStop(1,   'rgba(255,50,10,0.00)');
  ctx.fillStyle = corona2; ctx.fillRect(0, 0, W, H);

  const corona3 = ctx.createRadialGradient(W*0.14, H*0.73, 0, W*0.14, H*0.73, W*0.22);
  corona3.addColorStop(0,   'rgba(180,10,35,0.45)');
  corona3.addColorStop(0.5, 'rgba(140,5,20,0.22)');
  corona3.addColorStop(1,   'rgba(140,5,20,0.00)');
  ctx.fillStyle = corona3; ctx.fillRect(0, 0, W, H);

  const moonDisc = ctx.createRadialGradient(sunX-8, sunY-8, 0, sunX, sunY, H*0.22);
  moonDisc.addColorStop(0,    'rgba(6,0,2,1.00)');
  moonDisc.addColorStop(0.75, 'rgba(6,0,2,0.92)');
  moonDisc.addColorStop(1,    'rgba(6,0,2,0.00)');
  ctx.fillStyle = moonDisc;
  ctx.beginPath(); ctx.arc(sunX, sunY, H*0.22, 0, Math.PI*2); ctx.fill();

  const orbits = [
    { rx: W*0.19, ry: H*0.14, angle: -0.35, alpha: 0.50, lw: 1.8, color: [255,90,20]  },
    { rx: W*0.27, ry: H*0.20, angle:  0.18, alpha: 0.35, lw: 1.3, color: [255,50,10]  },
    { rx: W*0.34, ry: H*0.26, angle: -0.65, alpha: 0.25, lw: 1.0, color: [180,20,5]   },
    { rx: W*0.43, ry: H*0.32, angle:  0.42, alpha: 0.15, lw: 0.8, color: [140,10,5]   },
  ];
  for (const o of orbits) {
    ctx.save(); ctx.translate(sunX, sunY); ctx.rotate(o.angle);
    ctx.strokeStyle = `rgba(${o.color[0]},${o.color[1]},${o.color[2]},${o.alpha})`;
    ctx.lineWidth = o.lw; ctx.shadowColor = `rgba(${o.color[0]},${o.color[1]},${o.color[2]},0.7)`;
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  const arcs = [
    { pts: [[W*0.82,H*0.03],[W*0.97,H*0.22],[W*0.88,H*0.52],[W*0.72,H*0.66]], lw:2.8, color:'rgba(255,130,30,0.85)' },
    { pts: [[W*0.03,H*0.78],[W*0.16,H*0.60],[W*0.28,H*0.57],[W*0.32,H*0.72]], lw:2.0, color:'rgba(255,90,20,0.70)'  },
    { pts: [[W*0.42,H*0.08],[W*0.22,H*0.18],[W*0.14,H*0.38],[W*0.26,H*0.50]], lw:1.8, color:'rgba(255,160,40,0.65)' },
    { pts: [[W*0.55,H*0.88],[W*0.68,H*0.80],[W*0.78,H*0.82],[W*0.88,H*0.75]], lw:1.5, color:'rgba(255,80,10,0.55)'  },
  ];
  for (const a of arcs) {
    ctx.save(); ctx.strokeStyle = a.color; ctx.lineWidth = a.lw; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,100,20,0.9)'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.moveTo(a.pts[0][0],a.pts[0][1]);
    ctx.bezierCurveTo(a.pts[1][0],a.pts[1][1],a.pts[2][0],a.pts[2][1],a.pts[3][0],a.pts[3][1]);
    ctx.stroke(); ctx.restore();
  }

  const rng = mulberry32(123);
  for (let e = 0; e < 100; e++) {
    const ex=rng()*W, ey=rng()*H, er=rng()*2.2+0.25, warm=rng();
    let color;
    if      (warm > 0.72) color = `rgba(255,220,70,${0.55+rng()*0.45})`;
    else if (warm > 0.44) color = `rgba(255,110,20,${0.45+rng()*0.45})`;
    else                   color = `rgba(210,15,20,${0.35+rng()*0.45})`;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(ex, ey, er, 0, Math.PI*2); ctx.fill();
  }

  const rng2 = mulberry32(77);
  for (let s = 0; s < 10; s++) {
    const sx=rng2()*W, sy=rng2()*H, sl=4+rng2()*8;
    ctx.save(); ctx.strokeStyle=`rgba(255,200,60,${0.55+rng2()*0.45})`; ctx.lineWidth=0.9;
    ctx.shadowColor='rgba(255,180,40,0.9)'; ctx.shadowBlur=8;
    ctx.beginPath(); ctx.moveTo(sx-sl,sy); ctx.lineTo(sx+sl,sy); ctx.moveTo(sx,sy-sl); ctx.lineTo(sx,sy+sl);
    ctx.stroke(); ctx.restore();
  }

  const vignette = ctx.createRadialGradient(W/2, H/2, H*0.18, W/2, H/2, H*0.95);
  vignette.addColorStop(0, 'rgba(0,0,0,0.00)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.60)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
}

// ── Public dispatcher ─────────────────────────────────────────────────────────
export function renderBackground(ctx, theme, W, H) {
  switch (theme.pattern) {
    case 'bubbles': return renderBubbles(ctx, theme, W, H);
    case 'waves':   return renderWaves(ctx, theme, W, H);
    case 'neon':    return renderNeon(ctx, theme, W, H);
    case 'crimson': return renderCrimson(ctx, theme, W, H);
    default:        return renderBlobs(ctx, theme, W, H);
  }
}
