/**
 * Keep-Alive Module
 * ─────────────────
 * 1. Starts a lightweight HTTP server inside the bot process.
 *    Serves a status page at "/" and JSON health at "/ping" & "/health".
 * 2. Self-pings the public API endpoint every 4 minutes so the Replit
 *    container never idles out and Luvly stays online 24/7.
 *
 * External uptime monitors (UptimeRobot, BetterUptime, etc.) should ping:
 *   https://<your-replit-domain>/api/ping
 */

import http from 'node:http';

const startTime = Date.now();

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatUptime() {
  const total = Math.floor((Date.now() - startTime) / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function getStats(client) {
  return {
    status:    'online',
    bot:       client?.user?.tag  ?? 'connecting...',
    guilds:    client?.guilds?.cache?.size  ?? 0,
    commands:  client?.commands?.size       ?? 0,
    uptime:    formatUptime(),
    timestamp: new Date().toISOString(),
  };
}

// ── HTTP server ───────────────────────────────────────────────────────────────
export function startKeepAliveServer(client, port = 3000) {
  const server = http.createServer((req, res) => {
    const path = req.url?.split('?')[0] ?? '/';

    // JSON ping endpoints
    if (path === '/ping' || path === '/health') {
      const stats = getStats(client);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(stats));
    }

    // HTML status page
    const stats = getStats(client);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Luvly ✦ Status</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{
      font-family:'Segoe UI',sans-serif;
      background:linear-gradient(135deg,#0D0010 0%,#1C0A2E 60%,#0D0010 100%);
      min-height:100vh;color:#EDB5F8;
      display:flex;align-items:center;justify-content:center;
    }
    .card{
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(237,181,248,0.20);
      border-radius:20px;padding:2.5rem 3rem;
      max-width:440px;width:90%;text-align:center;
      box-shadow:0 0 60px rgba(178,86,216,0.25);
    }
    h1{font-size:2rem;letter-spacing:.05em;margin-bottom:.4rem}
    .dot{
      display:inline-block;width:10px;height:10px;
      background:#00FF88;border-radius:50%;
      margin-right:.5rem;
      box-shadow:0 0 8px #00FF88;
      animation:pulse 2s infinite;
    }
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .status{font-size:1.1rem;margin-bottom:2rem;color:#A0F0C0}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem}
    .stat{background:rgba(178,86,216,0.15);border-radius:12px;padding:.9rem}
    .stat-label{font-size:.72rem;letter-spacing:.08em;color:#C4A3DF;text-transform:uppercase;margin-bottom:.3rem}
    .stat-value{font-size:1.35rem;font-weight:700;color:#EDB5F8}
    .footer{font-size:.72rem;color:#886099;margin-top:.5rem}
  </style>
</head>
<body>
  <div class="card">
    <h1>✦ Luvly</h1>
    <p class="status"><span class="dot"></span>online &amp; serving</p>
    <div class="grid">
      <div class="stat"><div class="stat-label">Uptime</div><div class="stat-value">${stats.uptime}</div></div>
      <div class="stat"><div class="stat-label">Guilds</div><div class="stat-value">${stats.guilds}</div></div>
      <div class="stat"><div class="stat-label">Commands</div><div class="stat-value">${stats.commands}</div></div>
      <div class="stat"><div class="stat-label">Bot Tag</div><div class="stat-value" style="font-size:.95rem">${stats.bot}</div></div>
    </div>
    <p class="footer">last checked · ${new Date().toUTCString()}</p>
  </div>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[KEEP-ALIVE] port ${port} in use — status page skipped, self-ping still active`);
    } else {
      console.error('[KEEP-ALIVE] server error:', err.message);
    }
  });

  server.listen(port, () => {
    console.log(`✦ keep-alive server → http://localhost:${port}`);
  });

  return server;
}

// ── Self-ping ─────────────────────────────────────────────────────────────────
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
let pingUrl = null;
let consecutiveFails = 0;

async function doPing() {
  if (!pingUrl) return;
  try {
    const res = await fetch(pingUrl, { signal: AbortSignal.timeout(15_000) });
    consecutiveFails = 0;
    if (!res.ok) console.warn(`[PING] ${pingUrl} → ${res.status}`);
  } catch (err) {
    consecutiveFails++;
    console.warn(`[PING] failed (${consecutiveFails}x): ${err.message}`);
  }
}

export function startSelfPing(url) {
  pingUrl = url;

  // First ping after 90 seconds (let the process fully stabilise)
  setTimeout(doPing, 90_000);
  setInterval(doPing, PING_INTERVAL_MS);

  console.log(`✦ self-ping active → ${url} (every ${PING_INTERVAL_MS / 60000} min)`);
}
