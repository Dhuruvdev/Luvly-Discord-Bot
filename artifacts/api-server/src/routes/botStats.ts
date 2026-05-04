import { Router, type IRouter } from "express";

const router: IRouter = Router();

const BOT_LOCAL = `http://localhost:${process.env.BOT_PORT ?? "3000"}/ping`;

/**
 * GET /api/bot-stats
 * Proxies the bot's local keep-alive /ping endpoint so the status page
 * (served by the API server) can display live bot metrics.
 * Both processes share the same container, so localhost works.
 */
router.get("/bot-stats", async (_req, res) => {
  try {
    const upstream = await fetch(BOT_LOCAL, {
      signal: AbortSignal.timeout(5_000),
    });
    const data = await upstream.json();
    res.json(data);
  } catch {
    res.status(503).json({ error: "bot unreachable" });
  }
});

export default router;
