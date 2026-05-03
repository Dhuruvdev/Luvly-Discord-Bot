/**
 * Luvly Profile Card Generator
 * Uses @napi-rs/canvas (Skia-based, no system deps required).
 * Accepts a theme object from src/themes/index.js for full visual customisation.
 */

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getLevelData } from '../config.js';
import { renderBackground } from '../themes/renderer.js';
import { getTheme } from '../themes/index.js';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load Nunito from @fontsource/nunito (bundled woff2 files) ─────────────────
const FSRC = join(__dir, '../../node_modules/@fontsource/nunito/files');
let FONT = 'sans-serif';
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

// ── Logo asset (watermark) ────────────────────────────────────────────────────
const LOGO_PATH = join(__dir, '../../assets/logo.png');
let logoImg = null;
try {
  if (existsSync(LOGO_PATH)) logoImg = await loadImage(LOGO_PATH);
} catch {}

// ── Canvas dimensions ─────────────────────────────────────────────────────────
const W = 580, H = 900;

// ── Helpers ───────────────────────────────────────────────────────────────────
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y,         x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '', row = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + row * lh);
      line = w; row++;
    } else { line = test; }
  }
  if (line) ctx.fillText(line, x, y + row * lh);
  return row + 1;
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
    } catch { drawFallbackAvatar(ctx, x, y, size); }
  } else { drawFallbackAvatar(ctx, x, y, size); }
  ctx.restore();
}

function drawFallbackAvatar(ctx, x, y, size) {
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, '#D8B4FE');
  g.addColorStop(1, '#A78BFA');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, size, size);
}

// ── Stat pills ────────────────────────────────────────────────────────────────
function drawPills(ctx, stats, theme, startX, startY) {
  const PW = 178, PH = 34, GAP = 9;
  stats.forEach((stat, i) => {
    const py    = startY + i * (PH + GAP);
    const style = (theme.pills ?? [])[i] ?? { bg: '#E0D4FF', text: '#5A36A0' };

    ctx.fillStyle = style.bg;
    rrect(ctx, startX, py, PW, PH, PH / 2);
    ctx.fill();

    ctx.fillStyle    = style.text;
    ctx.font         = `600 12.5px '${FONT}', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.label, startX + 14, py + PH / 2);

    ctx.font      = '14px serif';
    ctx.textAlign = 'right';
    ctx.fillText(stat.icon, startX + PW - 10, py + PH / 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  });
}

// ── Watermark — real Luvly logo ───────────────────────────────────────────────
function drawWatermark(ctx, cx, y) {
  const LABEL = 'luvly cards';
  ctx.font = `600 10px '${FONT}', sans-serif`;
  const tw   = ctx.measureText(LABEL).width;
  const LOGO = 20;           // logo icon size inside badge
  const PAD  = { x: 10, y: 5 };
  const GAP  = logoImg ? 6 : 0;
  const bw   = PAD.x * 2 + (logoImg ? LOGO + GAP : 0) + tw;
  const bh   = LOGO + PAD.y * 2;

  // Pill background
  rrect(ctx, cx - bw / 2, y - bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();

  // Logo icon
  let textX = cx - bw / 2 + PAD.x;
  if (logoImg) {
    const lx = cx - bw / 2 + PAD.x;
    const ly = y - LOGO / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx + LOGO / 2, ly + LOGO / 2, LOGO / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, lx, ly, LOGO, LOGO);
    ctx.restore();
    textX = lx + LOGO + GAP;
  }

  // Label
  ctx.fillStyle    = '#FFFFFF';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.font         = `600 10px '${FONT}', sans-serif`;
  ctx.fillText(LABEL, textX, y);
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── White card ────────────────────────────────────────────────────────────────
async function drawCard(ctx, data, theme) {
  const CX = 57, CY = 360, CW = 466, CH = 258, CR = 22;

  // Card shadow
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur    = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle     = theme.cardBg ?? '#FFFFFF';
  rrect(ctx, CX, CY, CW, CH, CR);
  ctx.fill();
  ctx.restore();

  // Avatar
  await drawAvatar(ctx, data.avatarURL, CX + 26, CY + 28, 64);

  // Username
  ctx.fillStyle    = theme.nameColor ?? '#8B5CF6';
  ctx.font         = `800 44px '${FONT}', sans-serif`;
  ctx.textBaseline = 'alphabetic';
  const uname = data.username ?? 'unknown';
  // Clamp width
  while (ctx.measureText(uname).width > 185 && ctx.font.includes('44')) {
    ctx.font = ctx.font.replace(/\d+px/, m => `${parseInt(m) - 2}px`);
  }
  ctx.fillText(uname, CX + 26, CY + 127);

  // Tags
  ctx.fillStyle = theme.tagColor ?? '#C4A3DF';
  ctx.font      = `400 12.5px '${FONT}', sans-serif`;
  const tagStr  = buildTags(data);
  wrapText(ctx, tagStr, CX + 26, CY + 149, 188, 18);

  // Stat pills
  const stats = buildStats(data);
  drawPills(ctx, stats, theme, CX + 264, CY + 25);

  // Watermark
  drawWatermark(ctx, W / 2, CY + CH + 14);
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function buildTags(data) {
  const parts = [];
  if (data.pronouns) parts.push(data.pronouns);
  if (data.bio)      parts.push(data.bio);
  if (data.interests?.length) parts.push(...data.interests.slice(0, 4));
  return parts.length ? '• ' + parts.join(' • ') + ' •' : '• no tags yet •';
}

function buildStats(data) {
  const { current } = getLevelData(data.xp ?? 0);
  return [
    { label: `Level ${current.level}`,        icon: '✨' },
    { label: `${data.xp ?? 0} XP`,            icon: '⭐' },
    { label: `${data.streak ?? 0} day streak`, icon: '🔥' },
    { label: `${data.hearts ?? 0} hearts`,    icon: '💗' },
    { label: data.aura ?? 'soft',             icon: '🌸' },
  ];
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Generate a profile card PNG buffer.
 * @param {object} data    — user data ({ username, avatarURL, pronouns, bio, interests, xp, streak, hearts, aura })
 * @param {string} themeId — theme ID from src/themes/index.js (default: 'lavender')
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function generateCard(data, themeId = 'lavender') {
  const theme  = getTheme(themeId);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;

  renderBackground(ctx, theme);
  await drawCard(ctx, data, theme);

  return canvas.toBuffer('image/png');
}
