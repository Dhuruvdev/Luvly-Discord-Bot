/**
 * Luvly Profile Card Generator
 * Pixel-matched to the Lylac/Card.io aesthetic:
 *   - Soft pink-lavender background
 *   - Abstract decorative blobs + squiggles
 *   - White rounded card, left avatar/name/tags, right pastel pills
 */

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getLevelData } from '../config.js';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load Nunito from @fontsource/nunito (bundled woff files) ──────────────────
const FSRC = join(__dir, '../../node_modules/@fontsource/nunito/files');
let FONT   = 'sans-serif';
try {
  const f800 = join(FSRC, 'nunito-latin-800-normal.woff2');
  const f700 = join(FSRC, 'nunito-latin-700-normal.woff2');
  const f400 = join(FSRC, 'nunito-latin-400-normal.woff2');
  if (existsSync(f800)) { GlobalFonts.registerFromPath(f800, 'Nunito'); FONT = 'Nunito'; }
  if (existsSync(f700)) GlobalFonts.registerFromPath(f700, 'NunitoBold');
  if (existsSync(f400)) GlobalFonts.registerFromPath(f400, 'NunitoReg');
} catch (e) {
  console.warn('✦ font load failed, using system font:', e.message);
}

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const W = 580, H = 900;

// ── Palette ───────────────────────────────────────────────────────────────────
const BG         = '#EDB5F8';      // lavender-pink background
const BLOB_FILL  = 'rgba(178, 86, 216, 0.38)';
const BLOB_FILL2 = 'rgba(178, 86, 216, 0.22)';
const SQUIG      = 'rgba(178, 86, 216, 0.82)';
const CARD_CLR   = '#FFFFFF';
const NAME_CLR   = '#8B5CF6';
const TAG_CLR    = '#C4A3DF';
const WM_BG      = 'rgba(90, 55, 130, 0.52)';
const WM_TEXT    = '#FFFFFF';

// Right-side pill themes  [bg, text]
const PILLS = [
  { bg: '#BFF5F0', text: '#2E7A74' },   // mint
  { bg: '#D8CBFF', text: '#4A35A0' },   // lavender
  { bg: '#BFF5F0', text: '#2E7A74' },   // mint
  { bg: '#FFD2D2', text: '#963A3A' },   // rose
  { bg: '#E4D4FA', text: '#5A36A0' },   // soft purple
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line  = '';
  let lineN = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lineN * lh);
      line  = w;
      lineN++;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + lineN * lh);
  return lineN + 1;
}

// ── Decorative background shapes ──────────────────────────────────────────────
function drawBackground(ctx) {
  // Solid background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // ── Large circle top-right ──────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLOB_FILL;
  ctx.beginPath();
  ctx.arc(442, 72, 138, 0, Math.PI * 2);
  ctx.fill();
  // Crescent cutout (draw bg-coloured circle on top)
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(478, 116, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Top-left double squiggles ───────────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = SQUIG;
  ctx.lineWidth   = 7.5;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  // Left U / omega
  ctx.beginPath();
  ctx.moveTo(24, 218);
  ctx.bezierCurveTo(0, 138, 26, 88, 68, 108);
  ctx.bezierCurveTo(110, 128, 114, 182, 82, 220);
  ctx.stroke();

  // Right U / omega (overlapping)
  ctx.beginPath();
  ctx.moveTo(70, 230);
  ctx.bezierCurveTo(46, 150, 75, 98, 118, 118);
  ctx.bezierCurveTo(162, 138, 165, 194, 132, 232);
  ctx.stroke();
  ctx.restore();

  // ── Centre-left organic tear-drop blob ─────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLOB_FILL2;
  ctx.beginPath();
  ctx.moveTo(18, 292);
  ctx.bezierCurveTo(-28, 260, -12, 218, 35, 244);
  ctx.bezierCurveTo(82, 270, 84, 335, 50, 365);
  ctx.bezierCurveTo(16, 395, -22, 375, -32, 342);
  ctx.bezierCurveTo(-42, 308, 18, 292, 18, 292);
  ctx.fill();
  ctx.restore();

  // ── Decorative squiggle mid-right area ──────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = SQUIG;
  ctx.lineWidth   = 7;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(540, 240);
  ctx.bezierCurveTo(580, 268, 570, 310, 535, 305);
  ctx.bezierCurveTo(500, 300, 488, 260, 515, 250);
  ctx.stroke();
  ctx.restore();

  // ── Bottom-left large cursive flourish ──────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = SQUIG;
  ctx.lineWidth   = 8;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  // Big cursive "y"-like shape
  ctx.beginPath();
  ctx.moveTo(88, 900);
  ctx.bezierCurveTo(50, 860, 8, 810, 28, 768);
  ctx.bezierCurveTo(48, 726, 100, 728, 132, 765);
  ctx.bezierCurveTo(164, 802, 162, 856, 138, 892);
  ctx.stroke();

  // Tail loop at bottom
  ctx.beginPath();
  ctx.moveTo(138, 892);
  ctx.bezierCurveTo(118, 928, 72, 934, 55, 905);
  ctx.bezierCurveTo(38, 876, 62, 854, 88, 868);
  ctx.stroke();
  ctx.restore();

  // ── Bottom-right blob ───────────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLOB_FILL2;
  ctx.beginPath();
  ctx.arc(510, 830, 72, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Small scattered blobs for texture ──────────────────────────────────────
  ctx.save();
  ctx.fillStyle = BLOB_FILL2;
  ctx.beginPath();
  ctx.arc(28, 110, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(560, 680, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Avatar ────────────────────────────────────────────────────────────────────
async function drawAvatar(ctx, avatarURL, x, y, size) {
  ctx.save();
  rrect(ctx, x, y, size, size, 9);
  ctx.clip();

  if (avatarURL) {
    try {
      const img = await loadImage(avatarURL);
      ctx.drawImage(img, x, y, size, size);
    } catch {
      drawPlaceholderAvatar(ctx, x, y, size);
    }
  } else {
    drawPlaceholderAvatar(ctx, x, y, size);
  }
  ctx.restore();
}

function drawPlaceholderAvatar(ctx, x, y, size) {
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, '#D8B4FE');
  grad.addColorStop(1, '#A78BFA');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);
}

// ── Right-side stat pills ─────────────────────────────────────────────────────
function drawPills(ctx, stats, startX, startY) {
  const PW   = 178;   // pill width
  const PH   = 34;    // pill height
  const GAP  = 9;     // gap between pills
  const PFZ  = 12.5;  // font size

  stats.forEach((stat, i) => {
    const py    = startY + i * (PH + GAP);
    const style = PILLS[i] ?? PILLS[0];

    // Pill background
    ctx.fillStyle = style.bg;
    rrect(ctx, startX, py, PW, PH, PH / 2);
    ctx.fill();

    // Label text (left-aligned inside pill)
    ctx.fillStyle = style.text;
    ctx.font = `600 ${PFZ}px '${FONT}', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.label, startX + 14, py + PH / 2);

    // Icon / emoji (right side of pill)
    ctx.font = `${PFZ + 2}px serif`;
    ctx.textAlign = 'right';
    ctx.fillText(stat.icon, startX + PW - 10, py + PH / 2);

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  });
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function drawWatermark(ctx, cx, y) {
  const TXT = '✦ Luvly Cards';
  ctx.font = `400 10px '${FONT}', sans-serif`;
  const tw = ctx.measureText(TXT).width;
  const PX = 14, PY = 6;
  const bw = tw + PX * 2;
  const bh = 10 + PY * 2;

  rrect(ctx, cx - bw / 2, y - bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = WM_BG;
  ctx.fill();

  ctx.fillStyle    = WM_TEXT;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(TXT, cx, y);
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── White card ────────────────────────────────────────────────────────────────
async function drawCard(ctx, data) {
  const CX = 57, CY = 360, CW = 466, CH = 258, CR = 22;

  // Shadow layer
  ctx.save();
  ctx.shadowColor   = 'rgba(170, 95, 215, 0.28)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle     = CARD_CLR;
  rrect(ctx, CX, CY, CW, CH, CR);
  ctx.fill();
  ctx.restore();

  // ── Avatar ──────────────────────────────────────────────────────────────────
  const AVX = CX + 26, AVY = CY + 28, AVS = 64;
  await drawAvatar(ctx, data.avatarURL, AVX, AVY, AVS);

  // ── Username ────────────────────────────────────────────────────────────────
  ctx.fillStyle    = NAME_CLR;
  ctx.font         = `800 44px '${FONT}', sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.username ?? 'unknown', AVX, CY + 127);

  // ── Tags / bio ──────────────────────────────────────────────────────────────
  ctx.fillStyle = TAG_CLR;
  ctx.font      = `400 12.5px '${FONT}', sans-serif`;
  const tagStr  = buildTags(data);
  wrapText(ctx, tagStr, AVX, CY + 149, 188, 18);

  // ── Right side pills ────────────────────────────────────────────────────────
  const stats = buildStats(data);
  drawPills(ctx, stats, CX + 264, CY + 25);

  // ── Watermark ───────────────────────────────────────────────────────────────
  drawWatermark(ctx, W / 2, CY + CH + 14);
}

// ── Data builders ─────────────────────────────────────────────────────────────
function buildTags(data) {
  const parts = [];
  if (data.pronouns)  parts.push(data.pronouns);
  if (data.bio)       parts.push(data.bio);
  if (data.interests?.length) parts.push(...data.interests.slice(0, 4));
  return parts.length ? '• ' + parts.join(' • ') + ' •' : '• no tags yet •';
}

function buildStats(data) {
  const { current } = getLevelData(data.xp ?? 0);
  return [
    { label: `Level ${current.level}`,       icon: '✨' },
    { label: `${data.xp ?? 0} XP`,           icon: '⭐' },
    { label: `${data.streak ?? 0} day streak`,icon: '🔥' },
    { label: `${data.hearts ?? 0} hearts`,   icon: '💗' },
    { label: data.aura ?? 'soft',            icon: '🌸' },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Generate a profile card image buffer.
 * @param {object} data - { username, avatarURL, pronouns, bio, interests[], xp, streak, hearts, aura }
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function generateCard(data) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // Crisp text
  ctx.imageSmoothingEnabled = true;

  drawBackground(ctx);
  await drawCard(ctx, data);

  return canvas.toBuffer('image/png');
}
