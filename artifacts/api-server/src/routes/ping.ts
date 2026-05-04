import { Router, type IRouter } from "express";

const router: IRouter = Router();

const serverStart = Date.now();

function formatUptime(): string {
  const total = Math.floor((Date.now() - serverStart) / 1000);
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
 * GET /api/ping
 * Public keep-alive endpoint.
 * External uptime monitors (UptimeRobot, BetterUptime) should hit this URL.
 */
router.get("/ping", (_req, res) => {
  res.json({
    status:    "ok",
    service:   "luvly-api",
    uptime:    formatUptime(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
