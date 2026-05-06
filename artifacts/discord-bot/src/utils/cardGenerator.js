/**
 * Luvly Profile Card Generator — 800 × 600 landscape
 * Redesigned layout: compact white card, avatar with themed bg box,
 * clean right column, stat pills row at bottom.
 */

import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getLevelData } from '../config.js';
import { renderBackground } from '../themes/renderer.js';
import { getTheme } from '../themes/index.js';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Fonts ─────────────────────────────────────────────────────────────────────
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
  console.warn('✦ font load failed:', e.message);
}

// ── Logo ──────────────────────────────────────────────────────────────────────
const LOGO_PATH = join(__dir, '../../assets/logo.png');
let logoImg = null;
try {
  if (existsSync(LOGO_PATH)) logoImg = await loadImage(LOGO_PATH);
} catch {}

// ── Canvas size ───────────────────────────────────────────────────────────────
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
  while (ctx.measureText(text).width > maxW && size > 18) {
    size -= 2;
    ctx.font = `800 ${size}px '${FONT}', sans-serif`;
  }
}

function wrapText(ctx, text, x, y, maxW, lh, maxLines = 2) {
  const words = (text ?? '').split(' ');
  let line = '', row = 0;
  for (const word of words) {
    if (row >= maxLines) break;
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + row * lh);
      line = word; row++;
    } else { line = test; }
  }
  if (line && row < maxLines) ctx.fillText(line, x, y + row * lh);
}

// ── XP bar ────────────────────────────────────────────────────────────────────
function drawXpBar(ctx, xp, current, next, x, y, barW, theme) {
  const filled = next
    ? Math.min((xp - current.xp) / (next.xp - current.xp), 1)
    : 1;

  const BH = 10, R = 5;

  ctx.fillStyle = 'rgba(0,0,0,0.10)';
  rrect(ctx, x, y, barW, BH, R);
  ctx.fill();

  if (filled > 0) {
    ctx.fillStyle = theme.nameColor ?? '#8B5CF6';
    rrect(ctx, x, y, Math.max(barW * filled, R * 2), BH, R);
    ctx.fill();
  }

  const xpLabel = next ? `${xp} / ${next.xp} xp` : `${xp} xp · max`;
  ctx.fillStyle    = 'rgba(0,0,0,0.40)';
  ctx.font         = `600 10px '${FONT}', sans-serif`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(xpLabel, x + barW, y + BH / 2);
  ctx.textAlign = 'left';
}

// ── Avatar with themed background box ────────────────────────────────────────
async function drawAvatarBox(ctx, avatarURL, x, y, size, theme) {
  const PAD  = 10;
  const BOX  = size + PAD * 2;
  const bx   = x - PAD;
  const by   = y - PAD;

  // Colored bg box
  ctx.fillStyle = theme.avatarBg ?? 'rgba(180,160,210,0.45)';
  rrect(ctx, bx, by, BOX, BOX, 18);
  ctx.fill();

  // Avatar image clipped to rounded rect
  ctx.save();
  rrect(ctx, x, y, size, size, 12);
  ctx.clip();
  if (avatarURL) {
    try {
      const img = await loadImage(avatarURL);
      ctx.drawImage(img, x, y, size, size);
    } catch { drawFallback(ctx, x, y, size); }
  } else { drawFallback(ctx, x, y, size); }
  ctx.restore();
}

function drawFallback(ctx, x, y, size) {
  const g = ctx.createLinearGradient(x, y, x + size, y + size);
  g.addColorStop(0, '#D8B4FE');
  g.addColorStop(1, '#A78BFA');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, size, size);
}

// ── Stat pills ────────────────────────────────────────────────────────────────
function drawStatPills(ctx, stats, theme, startX, startY, cardW) {
  const count  = stats.length;
  const GAP    = 8;
  const PH     = 36;
  const PW     = Math.floor((cardW - GAP * (count - 1)) / count);

  stats.forEach((stat, i) => {
    const px    = startX + i * (PW + GAP);
    const style = (theme.pills ?? [])[i] ?? { bg: '#EDE9FE', text: '#6D28D9' };

    ctx.fillStyle = style.bg;
    rrect(ctx, px, startY, PW, PH, PH / 2);
    ctx.fill();

    // icon right-aligned
    ctx.font      = '14px serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.icon, px + PW - 11, startY + PH / 2);

    // label left-aligned
    ctx.fillStyle    = style.text;
    ctx.font         = `600 11px '${FONT}', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.label, px + 12, startY + PH / 2);

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  });
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function drawWatermark(ctx, cx, y) {
  const LABEL = 'luvly cards';
  ctx.font     = `600 10px '${FONT}', sans-serif`;
  const tw     = ctx.measureText(LABEL).width;
  const LOGO   = 18;
  const PAD    = { x: 10, y: 5 };
  const GAP    = logoImg ? 6 : 0;
  const bw     = PAD.x * 2 + (logoImg ? LOGO + GAP : 0) + tw;
  const bh     = LOGO + PAD.y * 2;

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

// ── Main draw ─────────────────────────────────────────────────────────────────
async function drawCard(ctx, data, theme) {
  // White card panel — 36px margin gives visible background breathing room
  const M  = 36;
  const CX = M, CY = M, CW = W - M * 2, CH = H - M * 2;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.18)';
  ctx.shadowBlur    = 32;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle     = theme.cardBg ?? '#FFFFFF';
  rrect(ctx, CX, CY, CW, CH, 24);
  ctx.fill();
  ctx.restore();

  // ── Left: avatar box ───────────────────────────────────────────────────────
  const AV_SIZE = 160;
  const AV_PAD  = 12;
  const AV_X    = CX + 32 + AV_PAD;
  const AV_Y    = CY + 32 + AV_PAD;
  await drawAvatarBox(ctx, data.avatarURL, AV_X, AV_Y, AV_SIZE, theme);

  // Vertical divider
  const DIV_X = AV_X + AV_SIZE + AV_PAD + 28;
  ctx.beginPath();
  ctx.moveTo(DIV_X, CY + 24);
  ctx.lineTo(DIV_X, CY + CH - 24);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Right: text column ─────────────────────────────────────────────────────
  const TX  = DIV_X + 24;
  const TW  = CX + CW - TX - 24;

  const { current, next } = getLevelData(data.xp ?? 0);

  // Username — large, bold, themed colour
  const uname = data.username ?? 'unknown';
  clampFont(ctx, uname, TW, 42);
  ctx.fillStyle    = theme.nameColor ?? '#8B5CF6';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(uname, TX, CY + 68);

  // Level / title line
  ctx.fillStyle = theme.tagColor ?? '#C4A3DF';
  ctx.font      = `600 13px '${FONT}', sans-serif`;
  ctx.fillText(`lv${current.level}  ·  ${current.title}`, TX, CY + 92);

  // XP bar
  drawXpBar(ctx, data.xp ?? 0, current, next, TX, CY + 106, TW, theme);

  // Pronouns / bio
  ctx.fillStyle = theme.tagColor ?? '#A78BFA';
  ctx.font      = `400 12.5px '${FONT}', sans-serif`;
  const sub = [data.pronouns, data.bio].filter(Boolean).join('  ·  ');
  if (sub) wrapText(ctx, sub, TX, CY + 136, TW, 19);

  // Interests
  if (data.interests?.length) {
    ctx.fillStyle = theme.tagColor ?? '#C4A3DF';
    ctx.font      = `400 12px '${FONT}', sans-serif`;
    wrapText(
      ctx,
      data.interests.slice(0, 5).map(i => `• ${i}`).join('  '),
      TX, CY + 175, TW, 18,
    );
  }

  // ── Bottom: stat pills ─────────────────────────────────────────────────────
  const PILL_TOP = CY + CH - 62;

  // thin separator above pills
  ctx.beginPath();
  ctx.moveTo(CX + 18, PILL_TOP - 14);
  ctx.lineTo(CX + CW - 18, PILL_TOP - 14);
  ctx.strokeStyle = 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  const stats = [
    { label: `Level ${current.level}`,     icon: '' },
    { label: `${data.xp ?? 0} XP`,         icon: '' },
    { label: `${data.streak ?? 0}d streak`, icon: '' },
    { label: `${data.hearts ?? 0} hearts`,  icon: '' },
    { label: data.aura ?? 'soft',           icon: '' },
  ];
  drawStatPills(ctx, stats, theme, CX + 18, PILL_TOP, CW - 36);

  // ── Watermark ──────────────────────────────────────────────────────────────
  drawWatermark(ctx, W / 2, H - 14);
}

// ── Export ────────────────────────────────────────────────────────────────────
export async function generateCard(data, themeId = 'lavender') {
  const theme  = getTheme(themeId);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  ctx.imageSmoothingEnabled = true;

  renderBackground(ctx, theme, W, H);
  await drawCard(ctx, data, theme);

  return canvas.toBuffer('image/png');
}
