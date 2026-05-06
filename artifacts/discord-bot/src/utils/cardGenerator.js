/**
 * Luvly Profile Card Generator — 900 × 380 horizontal banner
 * Redesigned: full-bleed theme background, frosted-glass overlay,
 * avatar left column, info right column, stat pills row at bottom.
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

// ── Luv Cash icon ─────────────────────────────────────────────────────────────
const CASH_PATH = join(__dir, '../../assets/luvcash.png');
let cashImg = null;
try {
  if (existsSync(CASH_PATH)) cashImg = await loadImage(CASH_PATH);
} catch {}

// ── Canvas size ───────────────────────────────────────────────────────────────
const W = 900, H = 380;

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

function isColorDark(hex) {
  if (!hex || !hex.startsWith('#')) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 100;
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
function drawXpBar(ctx, xp, current, next, x, y, barW, theme, isDark) {
  const filled = next
    ? Math.min((xp - current.xp) / (next.xp - current.xp), 1)
    : 1;

  const BH = 9, R = 4;

  // Track
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  rrect(ctx, x, y, barW, BH, R);
  ctx.fill();

  // Fill
  if (filled > 0) {
    ctx.fillStyle = theme.nameColor ?? '#8B5CF6';
    rrect(ctx, x, y, Math.max(barW * filled, R * 2), BH, R);
    ctx.fill();
  }

  const xpLabel = next ? `${xp} / ${next.xp} xp` : `${xp} xp · max`;
  ctx.fillStyle    = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.40)';
  ctx.font         = `600 10px '${FONT}', sans-serif`;
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(xpLabel, x + barW, y + BH / 2);
  ctx.textAlign = 'left';
}

// ── Avatar ────────────────────────────────────────────────────────────────────
async function drawAvatar(ctx, avatarURL, x, y, size, theme) {
  const PAD = 8;
  const BOX = size + PAD * 2;

  // Colored bg box behind avatar
  ctx.fillStyle = theme.avatarBg ?? (theme.nameColor ? theme.nameColor + '55' : 'rgba(180,160,210,0.45)');
  rrect(ctx, x - PAD, y - PAD, BOX, BOX, 16);
  ctx.fill();

  // Clip & draw avatar
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
function drawStatPills(ctx, stats, theme, startX, startY, cardW, isDark) {
  const count = stats.length;
  const GAP   = 6;
  const PH    = 30;
  const PW    = Math.floor((cardW - GAP * (count - 1)) / count);

  stats.forEach((stat, i) => {
    const px    = startX + i * (PW + GAP);
    const style = (theme.pills ?? [])[i] ?? { bg: '#EDE9FE', text: '#6D28D9' };

    // Pill bg - use theme color with transparency on dark themes
    ctx.fillStyle = isDark
      ? `rgba(255,255,255,0.10)`
      : style.bg;
    rrect(ctx, px, startY, PW, PH, PH / 2);
    ctx.fill();

    ctx.font      = '13px serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.icon, px + PW - 10, startY + PH / 2);

    ctx.fillStyle    = isDark ? 'rgba(255,255,255,0.85)' : style.text;
    ctx.font         = `600 10px '${FONT}', sans-serif`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(stat.label, px + 10, startY + PH / 2);

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  });
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function drawWatermark(ctx, cx, y) {
  const LABEL = 'luvly cards';
  ctx.font     = `600 10px '${FONT}', sans-serif`;
  const tw     = ctx.measureText(LABEL).width;
  const LOGO   = 16;
  const PAD    = { x: 8, y: 4 };
  const GAP    = logoImg ? 5 : 0;
  const bw     = PAD.x * 2 + (logoImg ? LOGO + GAP : 0) + tw;
  const bh     = LOGO + PAD.y * 2;

  rrect(ctx, cx - bw / 2, y - bh / 2, bw, bh, bh / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
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
  const isDark = isColorDark(theme.bg ?? '#ffffff');

  // ── Glass overlay panel ───────────────────────────────────────────────────
  // Sits over the background so it shows through on all edges
  const M  = 20;
  const CX = M, CY = M, CW = W - M * 2, CH = H - M * 2;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 6;
  // Semi-transparent so background theme is visible
  ctx.fillStyle = isDark
    ? 'rgba(10,5,20,0.62)'
    : 'rgba(255,255,255,0.68)';
  rrect(ctx, CX, CY, CW, CH, 22);
  ctx.fill();
  ctx.restore();

  // Subtle inner border for glass feel
  ctx.save();
  rrect(ctx, CX, CY, CW, CH, 22);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── Left column: avatar ───────────────────────────────────────────────────
  const AV_SIZE = 150;
  const AV_PAD  = 10;
  const AV_X    = CX + 28 + AV_PAD;
  const AV_Y    = CY + (CH - AV_SIZE) / 2 - 16;
  await drawAvatar(ctx, data.avatarURL, AV_X, AV_Y, AV_SIZE, theme);

  // Username below avatar
  const uname = data.username ?? 'unknown';
  ctx.font      = `800 12px '${FONT}', sans-serif`;
  ctx.fillStyle = theme.tagColor ?? '#C4A3DF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(uname, AV_X + AV_SIZE / 2, AV_Y + AV_SIZE + AV_PAD + 18);
  ctx.textAlign = 'left';

  // ── Vertical divider ──────────────────────────────────────────────────────
  const DIV_X = AV_X + AV_SIZE + AV_PAD + 22;
  ctx.beginPath();
  ctx.moveTo(DIV_X, CY + 20);
  ctx.lineTo(DIV_X, CY + CH - 20);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Right column: info ────────────────────────────────────────────────────
  const TX = DIV_X + 22;
  const TW = CX + CW - TX - 22;

  const { current, next } = getLevelData(data.xp ?? 0);

  // Display name — large, bold, themed colour
  clampFont(ctx, uname, TW, 36);
  ctx.fillStyle    = theme.nameColor ?? '#8B5CF6';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(uname, TX, CY + 52);

  // Level / title
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.65)' : (theme.tagColor ?? '#C4A3DF');
  ctx.font      = `600 12px '${FONT}', sans-serif`;
  ctx.fillText(`lv${current.level}  ·  ${current.title}`, TX, CY + 72);

  // XP bar
  drawXpBar(ctx, data.xp ?? 0, current, next, TX, CY + 82, TW, theme, isDark);

  // Thin divider
  ctx.beginPath();
  ctx.moveTo(TX, CY + 104);
  ctx.lineTo(TX + TW, CY + 104);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Pronouns / bio
  const textColor = isDark ? 'rgba(255,255,255,0.80)' : (theme.tagColor ?? '#A78BFA');
  ctx.fillStyle = textColor;
  ctx.font      = `400 12px '${FONT}', sans-serif`;
  const sub = [data.pronouns, data.bio].filter(Boolean).join('  ·  ');
  if (sub) wrapText(ctx, sub, TX, CY + 122, TW, 18, 3);

  // Interests
  if (data.interests?.length) {
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.60)' : (theme.tagColor ?? '#C4A3DF');
    ctx.font      = `400 11px '${FONT}', sans-serif`;
    wrapText(
      ctx,
      data.interests.slice(0, 5).map(i => `• ${i}`).join('  '),
      TX, CY + 190, TW, 17, 2,
    );
  }

  // ── Stat pills row at bottom ──────────────────────────────────────────────
  const PILL_TOP = CY + CH - 48;

  // Separator above pills
  ctx.beginPath();
  ctx.moveTo(CX + 16, PILL_TOP - 12);
  ctx.lineTo(CX + CW - 16, PILL_TOP - 12);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  const stats = [
    { label: `Level ${current.level}`,     icon: '' },
    { label: `${data.xp ?? 0} XP`,         icon: '' },
    { label: `${data.streak ?? 0}d streak`, icon: '' },
    { label: `${data.hearts ?? 0} hearts`,  icon: '' },
    { label: data.aura ?? 'soft',           icon: '' },
  ];
  drawStatPills(ctx, stats, theme, CX + 16, PILL_TOP, CW - 32, isDark);

  // ── Watermark ─────────────────────────────────────────────────────────────
  drawWatermark(ctx, W / 2, H - 10);
}

// ── Daily Card draw ───────────────────────────────────────────────────────────
async function drawDailyCard(ctx, data, theme) {
  const isDark = isColorDark(theme.bg ?? '#ffffff');

  // Glass panel — same dimensions as profile card
  const M  = 20;
  const CX = M, CY = M, CW = W - M * 2, CH = H - M * 2;

  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.22)';
  ctx.shadowBlur    = 28;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = isDark ? 'rgba(10,5,20,0.62)' : 'rgba(255,255,255,0.68)';
  rrect(ctx, CX, CY, CW, CH, 22);
  ctx.fill();
  ctx.restore();

  ctx.save();
  rrect(ctx, CX, CY, CW, CH, 22);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.80)';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── Left column: luv cash icon ────────────────────────────────────────────
  const AV_SIZE = 150;
  const AV_PAD  = 10;
  const AV_X    = CX + 28 + AV_PAD;
  const AV_Y    = CY + (CH - AV_SIZE) / 2 - 16;

  // Colored bg box (same as avatar box in profile)
  ctx.fillStyle = theme.avatarBg ?? (theme.nameColor ? theme.nameColor + '55' : 'rgba(180,160,210,0.45)');
  rrect(ctx, AV_X - AV_PAD, AV_Y - AV_PAD, AV_SIZE + AV_PAD * 2, AV_SIZE + AV_PAD * 2, 16);
  ctx.fill();

  // Draw luv cash icon — object-fit: contain inside the box
  if (cashImg) {
    const iw = cashImg.width, ih = cashImg.height;
    const scale = Math.min(AV_SIZE / iw, AV_SIZE / ih) * 0.82;
    const dw = iw * scale, dh = ih * scale;
    const dx = AV_X + (AV_SIZE - dw) / 2;
    const dy = AV_Y + (AV_SIZE - dh) / 2;
    ctx.drawImage(cashImg, dx, dy, dw, dh);
  } else {
    // Fallback: big heart text
    ctx.font      = `800 64px '${FONT}', sans-serif`;
    ctx.fillStyle = theme.nameColor ?? '#A78BFA';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('', AV_X + AV_SIZE / 2, AV_Y + AV_SIZE / 2);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // "daily reward" label below icon
  ctx.fillStyle    = isDark ? 'rgba(255,255,255,0.55)' : (theme.tagColor ?? '#C4A3DF');
  ctx.font         = `600 11px '${FONT}', sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('daily reward', AV_X + AV_SIZE / 2, AV_Y + AV_SIZE + AV_PAD + 18);
  ctx.textAlign    = 'left';

  // ── Vertical divider ──────────────────────────────────────────────────────
  const DIV_X = AV_X + AV_SIZE + AV_PAD + 22;
  ctx.beginPath();
  ctx.moveTo(DIV_X, CY + 20);
  ctx.lineTo(DIV_X, CY + CH - 20);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // ── Right column ──────────────────────────────────────────────────────────
  const TX = DIV_X + 22;
  const TW = CX + CW - TX - 22;

  const { current, next } = getLevelData(data.xp ?? 0);

  // Username
  clampFont(ctx, data.username ?? 'unknown', TW, 36);
  ctx.fillStyle    = theme.nameColor ?? '#8B5CF6';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.username ?? 'unknown', TX, CY + 52);

  // Streak subtitle
  const streakLabel = data.streak >= 7
    ? `day ${data.streak} streak  ·  you're on fire! 🔥`
    : data.streak >= 3
      ? `day ${data.streak} streak  ·  keep it up! ✦`
      : `day ${data.streak} streak`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.60)' : (theme.tagColor ?? '#C4A3DF');
  ctx.font      = `600 12px '${FONT}', sans-serif`;
  ctx.fillText(streakLabel, TX, CY + 72);

  // XP bar
  drawXpBar(ctx, data.xp ?? 0, current, next, TX, CY + 82, TW, theme, isDark);

  // Divider
  ctx.beginPath();
  ctx.moveTo(TX, CY + 104);
  ctx.lineTo(TX + TW, CY + 104);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  // Rewards section
  const textColor = isDark ? 'rgba(255,255,255,0.85)' : (theme.tagColor ?? '#A78BFA');
  ctx.fillStyle    = textColor;
  ctx.font         = `700 13px '${FONT}', sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText("today's drop", TX, CY + 126);

  // Hearts earned
  ctx.font      = `800 28px '${FONT}', sans-serif`;
  ctx.fillStyle = theme.nameColor ?? '#8B5CF6';
  ctx.fillText(`+${data.earnedHearts ?? 0}`, TX, CY + 166);

  ctx.font      = `600 11px '${FONT}', sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.50)' : (theme.tagColor ?? '#C4A3DF');
  ctx.fillText('hearts', TX, CY + 182);

  // XP earned
  const xpColX = TX + 90;
  ctx.font      = `800 28px '${FONT}', sans-serif`;
  ctx.fillStyle = theme.nameColor ?? '#8B5CF6';
  ctx.fillText(`+${data.earnedXp ?? 0}`, xpColX, CY + 166);

  ctx.font      = `600 11px '${FONT}', sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.50)' : (theme.tagColor ?? '#C4A3DF');
  ctx.fillText('xp', xpColX, CY + 182);

  // Multiplier badge
  if ((data.multiplier ?? 1) > 1) {
    const badgeX = xpColX + 65;
    const badgeTxt = `×${data.multiplier} streak bonus`;
    ctx.font = `600 10px '${FONT}', sans-serif`;
    const bw = ctx.measureText(badgeTxt).width + 16;
    const bh = 20;
    const by = CY + 155;
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.12)' : (theme.nameColor + '22' ?? '#EDE9FE');
    rrect(ctx, badgeX, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = theme.nameColor ?? '#8B5CF6';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeTxt, badgeX + bw / 2, by + bh / 2);
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Total hearts info line
  ctx.font      = `400 11px '${FONT}', sans-serif`;
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.45)' : (theme.tagColor ?? '#C4A3DF');
  ctx.fillText(`total: ${data.hearts ?? 0} hearts  ·  lv${current.level} — ${current.title}`, TX, CY + 210);

  // ── Bottom stat pills ─────────────────────────────────────────────────────
  const PILL_TOP = CY + CH - 48;

  ctx.beginPath();
  ctx.moveTo(CX + 16, PILL_TOP - 12);
  ctx.lineTo(CX + CW - 16, PILL_TOP - 12);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  ctx.lineWidth   = 1;
  ctx.stroke();

  const mult  = data.multiplier ?? 1;
  const stats = [
    { label: `${data.hearts ?? 0} hearts`,    icon: '' },
    { label: `+${data.earnedXp ?? 0} xp`,     icon: '' },
    { label: `${data.streak ?? 0}d streak`,    icon: '' },
    { label: `Level ${current.level}`,         icon: '' },
    { label: mult > 1 ? `×${mult} bonus` : 'no bonus', icon: '' },
  ];
  drawStatPills(ctx, stats, theme, CX + 16, PILL_TOP, CW - 32, isDark);

  // ── Watermark ─────────────────────────────────────────────────────────────
  drawWatermark(ctx, W / 2, H - 10);
}

// ── Exports ───────────────────────────────────────────────────────────────────
export async function generateCard(data, themeId = 'lavender') {
  const theme  = getTheme(themeId);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  renderBackground(ctx, theme, W, H);
  await drawCard(ctx, data, theme);
  return canvas.toBuffer('image/png');
}

export async function generateDailyCard(data, themeId = 'lavender') {
  const theme  = getTheme(themeId);
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  renderBackground(ctx, theme, W, H);
  await drawDailyCard(ctx, data, theme);
  return canvas.toBuffer('image/png');
}
