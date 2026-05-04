import { useEffect, useState, useCallback } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BotStats {
  status:    string;
  bot:       string;
  guilds:    number;
  commands:  number;
  uptime:    string;
  timestamp: string;
}

interface ApiStats {
  status:    string;
  service:   string;
  uptime:    string;
  timestamp: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

function StatCard({ label, value, wide = false }: { label: string; value: string | number; wide?: boolean }) {
  return (
    <div
      className={`card-glass rounded-2xl px-5 py-4 flex flex-col gap-1 transition-all hover:border-purple-500/30 ${wide ? "col-span-2" : ""}`}
    >
      <span className="text-[0.68rem] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </span>
      <span className="text-[1.45rem] font-bold leading-tight text-foreground break-all">
        {value || <span className="opacity-30">—</span>}
      </span>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [bot,       setBot]       = useState<BotStats | null>(null);
  const [api,       setApi]       = useState<ApiStats | null>(null);
  const [online,    setOnline]    = useState<boolean | null>(null);
  const [lastUpdate,setLastUpdate]= useState<string>("");
  const [copied,    setCopied]    = useState(false);
  const [countdown, setCountdown] = useState(30);

  // The monitor URL is the canonical public ping endpoint
  const monitorUrl = `${window.location.origin}/api/ping`;

  const refresh = useCallback(async () => {
    try {
      const [apiData, botData] = await Promise.allSettled([
        fetchJson<ApiStats>("/api/ping"),
        fetchJson<BotStats>("/api/bot-stats"),
      ]);

      if (apiData.status === "fulfilled") {
        setApi(apiData.value);
        setOnline(true);
      } else {
        setOnline(false);
      }

      if (botData.status === "fulfilled") {
        setBot(botData.value);
      }

      setLastUpdate(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCountdown(30);
    } catch {
      setOnline(false);
    }
  }, []);

  // Initial fetch + 30-second interval
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1_000);
    return () => clearInterval(t);
  }, []);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(monitorUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      /* clipboard blocked */
    }
  }

  const isOnline = online === true;
  const isLoading = online === null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8"
      style={{
        background:
          "radial-gradient(ellipse 75% 55% at 12% 10%, rgba(120,40,200,0.20) 0%, transparent 65%), " +
          "radial-gradient(ellipse 65% 45% at 90% 90%, rgba(60,20,120,0.16) 0%, transparent 65%)",
      }}
    >
      {/* ── Header ── */}
      <header className="text-center space-y-2 select-none">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-4xl">✦</span>
          <h1 className="text-5xl font-black tracking-tight text-gradient">Luvly</h1>
        </div>
        <p className="text-sm text-muted-foreground tracking-wide">real-time bot &amp; api status</p>
      </header>

      {/* ── Status Badge ── */}
      <div>
        {isLoading ? (
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full card-glass text-sm font-semibold text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-muted-foreground animate-spin-slow" />
            checking...
          </div>
        ) : isOnline ? (
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/25 text-sm font-semibold text-green-400">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 glow-green animate-pulse-dot" />
            online &amp; serving
          </div>
        ) : (
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-red-500/10 border border-red-500/25 text-sm font-semibold text-red-400">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 glow-red animate-pulse-dot" />
            unreachable
          </div>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
        <StatCard label="Bot Uptime"  value={bot?.uptime    ?? "—"} />
        <StatCard label="API Uptime"  value={api?.uptime    ?? "—"} />
        <StatCard label="Guilds"      value={bot?.guilds    ?? "—"} />
        <StatCard label="Commands"    value={bot?.commands  ?? "—"} />
        <StatCard label="Bot Tag"     value={bot?.bot       ?? "—"} wide />
      </div>

      {/* ── Monitor URL Card ── */}
      <div className="card-glass rounded-2xl w-full max-w-md px-5 py-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[0.7rem] font-semibold tracking-widest uppercase text-muted-foreground mb-1">
              📡 uptime monitor url
            </p>
            <p className="text-xs text-accent break-all font-mono leading-relaxed">
              {monitorUrl}
            </p>
          </div>
          <button
            onClick={copyUrl}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors mt-4"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p className="text-[0.68rem] text-muted-foreground leading-relaxed">
          Paste this URL into <span className="text-foreground font-medium">UptimeRobot</span> or{" "}
          <span className="text-foreground font-medium">BetterUptime</span> to keep Luvly alive 24/7
        </p>
      </div>

      {/* ── Refresh Footer ── */}
      <footer className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Auto-refreshes in{" "}
          <span className="text-foreground font-semibold tabular-nums">{countdown}s</span>
          {lastUpdate && (
            <>
              {" · "}Last update:{" "}
              <span className="text-foreground font-semibold">{lastUpdate}</span>
            </>
          )}
        </p>
        <button
          onClick={refresh}
          className="text-xs text-primary hover:text-accent transition-colors underline underline-offset-2"
        >
          refresh now
        </button>
      </footer>
    </div>
  );
}
