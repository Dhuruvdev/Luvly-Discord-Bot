import { Router, type IRouter } from "express";

const router: IRouter = Router();

const serverStart = Date.now();

function formatUptime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * GET /api/status
 * Beautiful live status page — visible in the Replit preview pane.
 * Auto-refreshes every 30 s by fetching /api/ping client-side.
 */
router.get("/status", (_req, res) => {
  const uptime = formatUptime(Date.now() - serverStart);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Luvly ✦ Status</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:     #09000F;
      --card:   rgba(255,255,255,0.04);
      --border: rgba(237,181,248,0.15);
      --purple: #EDB5F8;
      --soft:   #C4A3DF;
      --green:  #00FF88;
      --muted:  #6B4A7B;
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      background-image:
        radial-gradient(ellipse 70% 50% at 10% 10%, rgba(120,40,200,0.22) 0%, transparent 70%),
        radial-gradient(ellipse 60% 40% at 90% 90%, rgba(60,20,120,0.18) 0%, transparent 70%);
      min-height: 100vh;
      color: var(--purple);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      gap: 2rem;
    }

    /* ── header ── */
    .header { text-align: center; }
    .header h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      font-weight: 900;
      letter-spacing: .04em;
      background: linear-gradient(135deg, #EDB5F8, #C060CC, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .header p { color: var(--soft); font-size: .9rem; margin-top: .4rem; }

    /* ── status badge ── */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: .55rem;
      background: rgba(0,255,136,0.08);
      border: 1px solid rgba(0,255,136,0.25);
      border-radius: 999px;
      padding: .45rem 1.1rem;
      font-size: .9rem;
      font-weight: 600;
      color: var(--green);
    }
    .dot {
      width: 9px; height: 9px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

    /* ── stats grid ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
      gap: 1rem;
      width: 100%;
      max-width: 640px;
    }
    .stat {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.1rem 1.3rem;
      transition: border-color .2s;
    }
    .stat:hover { border-color: rgba(237,181,248,0.35); }
    .stat-label {
      font-size: .68rem;
      font-weight: 600;
      letter-spacing: .1em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: .4rem;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--purple);
      line-height: 1;
    }
    .stat-value.small { font-size: 1rem; padding-top: .2rem; word-break: break-all; }

    /* ── ping card ── */
    .ping-card {
      width: 100%;
      max-width: 640px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1rem 1.4rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .ping-label { font-size: .78rem; color: var(--muted); }
    .ping-url {
      font-size: .78rem;
      color: var(--soft);
      word-break: break-all;
      flex: 1;
    }
    .copy-btn {
      background: rgba(178,86,216,0.15);
      border: 1px solid rgba(178,86,216,0.30);
      color: var(--purple);
      border-radius: 8px;
      padding: .35rem .8rem;
      font-size: .75rem;
      cursor: pointer;
      white-space: nowrap;
      transition: background .15s;
    }
    .copy-btn:hover { background: rgba(178,86,216,0.28); }

    /* ── footer ── */
    .footer {
      font-size: .72rem;
      color: var(--muted);
      text-align: center;
      line-height: 1.8;
    }
    .footer span { color: var(--soft); }

    /* ── loading shimmer ── */
    .shimmer {
      background: linear-gradient(90deg, rgba(237,181,248,0.06) 25%, rgba(237,181,248,0.14) 50%, rgba(237,181,248,0.06) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 6px;
      height: 1.5rem;
      width: 80%;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  </style>
</head>
<body>

  <div class="header">
    <h1>✦ Luvly</h1>
    <p>real-time bot &amp; api status</p>
  </div>

  <div class="badge">
    <div class="dot" id="statusDot"></div>
    <span id="statusText">online</span>
  </div>

  <div class="grid">
    <div class="stat">
      <div class="stat-label">Bot Uptime</div>
      <div class="stat-value" id="botUptime"><div class="shimmer"></div></div>
    </div>
    <div class="stat">
      <div class="stat-label">API Uptime</div>
      <div class="stat-value" id="apiUptime">${uptime}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Guilds</div>
      <div class="stat-value" id="guilds"><div class="shimmer"></div></div>
    </div>
    <div class="stat">
      <div class="stat-label">Commands</div>
      <div class="stat-value" id="commands"><div class="shimmer"></div></div>
    </div>
    <div class="stat" style="grid-column:span 2">
      <div class="stat-label">Bot Tag</div>
      <div class="stat-value small" id="botTag"><div class="shimmer"></div></div>
    </div>
  </div>

  <div class="ping-card">
    <div>
      <div class="ping-label">📡 Uptime monitor URL</div>
      <div class="ping-url" id="pingUrl">loading...</div>
    </div>
    <button class="copy-btn" id="copyBtn" onclick="copyUrl()">Copy</button>
  </div>

  <div class="footer">
    Auto-refreshes every 30 s &nbsp;·&nbsp;
    Last update: <span id="lastUpdate">—</span><br/>
    Add the URL above to UptimeRobot or BetterUptime to keep Luvly alive 24/7
  </div>

  <script>
    const BOT_PING = location.origin + '/api/ping';
    const BOT_STATUS = location.origin + '/api/bot-stats';

    function set(id, val) {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    function copyUrl() {
      const url = document.getElementById('pingUrl')?.textContent;
      if (!url || url === 'loading...') return;
      navigator.clipboard.writeText(url).catch(() => {});
      const btn = document.getElementById('copyBtn');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
    }

    async function refresh() {
      // Set the monitor URL
      document.getElementById('pingUrl').textContent = BOT_PING;

      try {
        const res  = await fetch(BOT_PING);
        const data = await res.json();
        set('apiUptime', data.uptime ?? '—');
        set('lastUpdate', new Date().toLocaleTimeString());

        // Try to get bot-specific stats
        try {
          const br   = await fetch(BOT_STATUS);
          const bdat = await br.json();
          set('botUptime',  bdat.uptime   ?? '—');
          set('guilds',     bdat.guilds   ?? '—');
          set('commands',   bdat.commands ?? '—');
          set('botTag',     bdat.bot      ?? '—');
        } catch {
          set('botUptime', data.uptime ?? '—');
          set('guilds',    '—');
          set('commands',  '—');
          set('botTag',    '—');
        }

        // green dot
        document.getElementById('statusDot').style.background = '#00FF88';
        document.getElementById('statusDot').style.boxShadow = '0 0 8px #00FF88';
        set('statusText', 'online');
      } catch {
        document.getElementById('statusDot').style.background = '#FF4444';
        document.getElementById('statusDot').style.boxShadow = '0 0 8px #FF4444';
        set('statusText', 'unreachable');
      }
    }

    refresh();
    setInterval(refresh, 30_000);
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(html);
});

export default router;
