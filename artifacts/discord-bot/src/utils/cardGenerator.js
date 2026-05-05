/**
 * Luvly Profile Card Generator — 800 × 600 landscape format
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

// ── Load Nunito from @fontsource/nunito ────────────────────────────────────────
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

// ── Canvas dimensions — 800 × 600 landscape ───────────────────────────────────
const W = 800, H = 600;

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

function clampFont(ctx, text, maxW, startPx) {
  let size = startPx;
  ctx.font = `800 ${size}px '${FONT}', sans-serif`;
  while (ctx.measureText(text).width > maxW && size > 16) {
    size -= 2;
    ctx.font = `800 ${size}px '${FONT}', sans-serif`;
  }
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines = 2) {
  const words = (text ?? '').split(' ');
  let line = '', row = 0;
  for (const w of words) {
    if (row >= maxLines) break;
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + row * lh);
      line = w; row++;
    } else { line = test; }
  }
  if (line && row < maxLines) ctx.fillText(line, x, y + row * lh);
}

// ── XP bar ────────────────────────────────────────────────────────────────────
function drawXpBar(ctx, xp, current, next, x, y, barW, theme) {
  const filled = next
    ? Math.min((xp - current.xp) / (next.xp - current.xp), 1)
    : 1;

  // Track
  const BH = 12, R = 6;
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  rrect(ctx, x, y, barW, BH, R);
  ctx.fill();

  // Fill
  if (filled > 0) {
    ctx.fillStyle = theme.nameColor ?? '#8B5CF6';
    rrect(ctx, x, y, Math.max(barW * filled, R * 2), BH, R);
    ctx.fill();
  }

  // XP label
  ctx.fillStyle   = 'rgba(0,0,0,0.5)';
  ctx.font        = `600 10px '${FONT}', sans-serif`;
  ctx.textAlign   = 'right';
  ctx.textBaseline = 'middle';
  const xpLabel   = next ? `${xp} / ${next.xp} xp` : `${xp} xp · max level`;
  ctx.fillText(xpLabel, x + barW, y + BH / 2);
  ctx.textAlign = 'left';
}

// ── Avatar ────────────────────────────────────────────────────────────────────
async function drawAvatar(ctx, avatarURL, x, y, size) {
  ctx.save();
  rrect(ctx, x, y, size, size, 16);
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
function drawStatPills(ctx, stats, theme, startX, startY) {
  const PW = 134, PH = 34, GAP = 8;

  stats.forEach((stat, i) => {
    const px    = startX + i * (PW + GAP);
    const style = (theme.pills ?? [])[i] ?? { bg: '#E0D4FF', text: '#5A36A0' };

    ctx.fillStyle = style.bg;
    rrect(ctx, px, startY, PW, PH, PH / 2);
    ctx.fill();

    ctx.fillStyle    = style.text;
    ctx.font         = `600 11.5px '${FONT}', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.label, px + 12, startY + PH / 2);

    ctx.font      = '13px serif';
    ctx.textAlign = 'right';
    ctx.fillText(stat.icon, px + PW - 10, startY + PH / 2);

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  });
}

// ── Divider ───────────────────────────────────────────────────────────────────
function drawDivider(ctx, x, y, w) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth   = 1;
  ctx.stroke();
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function drawWatermark(ctx, cx, y) {
  const LABEL = 'luvly cards';
  ctx.font = `600 10px '${FONT}', sans-serif`;
  const tw   = ctx.measureText(LABEL).width;
  const LOGO = 18;
  const PAD  = { x: 10, y: 5 };
  const GAP  = logoImg ? 6 : 0;
  const bw   = PAD.x * 2 + (logoImg ? LOGO + GAP : 0) + tw;
  const bh   = LOGO + PAD.y * 2;

  rrect(ctx, cx - bw / 2, y - bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fill();

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

  ctx.fillStyle    = '#FFFFFF';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  ctx.font         = `600 10px '${FONT}', sans-serif`;
  ctx.fillText(LABEL, textX, y);
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── Main card layout (800 × 600 landscape) ────────────────────────────────────
async function drawCard(ctx, data, theme) {
  // ── Card panel ──────────────────────────────────────────────────────────────
  const MARGIN = 24;
  const CX = MARGIN, CY = MARGIN, CW = W - MARGIN * 2, CH = H - MARGIN * 2;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.16)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle     = theme.cardBg ?? '#FFFFFF';
  rrect(ctx, CX, CY, CW, CH, 22);
  ctx.fill();
  ctx.restore();

  // ── Left column: avatar ─────────────────────────────────────────────────────
  const AV_SIZE = 176;
  const AV_X   = CX + 28;
  const AV_Y   = CY + 28;
  await drawAvatar(ctx, data.avatarURL, AV_X, AV_Y, AV_SIZE);

  // Thin vertical divider between columns
  const DIV_X = AV_X + AV_SIZE + 24;
  ctx.beginPath();
  ctx.moveTo(DIV_X, CY + 20);
  ctx.lineTo(DIV_X, CY + CH - 20);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Right column ────────────────────────────────────────────────────────────
  const TEXT_X = DIV_X + 22;
  const TEXT_W = CX + CW - TEXT_X - 20;

  // Username
  const uname = data.username ?? 'unknown';
  clampFont(ctx, uname, TEXT_W, 40);
  ctx.fillStyle    = theme.nameColor ?? '#8B5CF6';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(uname, TEXT_X, CY + 64);

  // Level / title
  const { current, next } = getLevelData(data.xp ?? 0);
  ctx.fillStyle = theme.tagColor ?? '#C4A3DF';
  ctx.font      = `600 14px '${FONT}', sans-serif`;
  ctx.fillText(`lv${current.level}  ·  ${current.title}`, TEXT_X, CY + 92);

  // XP bar
  drawXpBar(ctx, data.xp ?? 0, current, next, TEXT_X, CY + 106, TEXT_W, theme);

  // Pronouns + bio
  ctx.fillStyle = theme.tagColor ?? '#A78BFA';
  ctx.font      = `400 13px '${FONT}', sans-serif`;
  const pronStr = [data.pronouns, data.bio].filter(Boolean).join('  ·  ');
  if (pronStr) wrapText(ctx, pronStr, TEXT_X, CY + 138, TEXT_W, 18);

  // Interests tags
  if (data.interests?.length) {
    ctx.fillStyle = theme.tagColor ?? '#C4A3DF';
    ctx.font      = `400 12px '${FONT}', sans-serif`;
    wrapText(ctx, data.interests.slice(0, 5).map(i => `• ${i}`).join('  '), TEXT_X, CY + 178, TEXT_W, 18);
  }

  // ── Divider ─────────────────────────────────────────────────────────────────
  const PILL_Y = CY + CH - 90;
  drawDivider(ctx, CX + 20, PILL_Y - 16, CW - 40);

  // ── Stat pills row ──────────────────────────────────────────────────────────
  const stats = [
    { label: `Level ${current.level}`,        icon: '✨' },
    { label: `${data.xp ?? 0} XP`,            icon: '⭐' },
    { label: `${data.streak ?? 0}d streak`,    icon: '🔥' },
    { label: `${data.hearts ?? 0} hearts`,     icon: '💗' },
    { label: data.aura ?? 'soft',              icon: '🌸' },
  ];
  drawStatPills(ctx, stats, theme, CX + 24, PILL_Y);

  // ── Watermark ───────────────────────────────────────────────────────────────
  drawWatermark(ctx, W / 2, H - 14);
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Generate a profile card PNG buffer at 800 × 600 (landscape).
 * @param {object} data    — user data ({ username, avatarURL, pronouns, bio, interests, xp, streak, hearts, aura })
 * @param {string} themeId — theme ID from src/themes/index.js (default: 'lavender')
 * @returns {Promise<Buffer>} PNG buffer
 */
export async function generateCard(data, themeId = 'lavender') {
  const theme  = getTheme(themeId);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;

  renderBackground(ctx, theme, W, H);
  await drawCard(ctx, data, theme);

  return canvas.toBuffer('image/png');
}
