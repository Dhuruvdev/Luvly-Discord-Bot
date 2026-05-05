import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  spawnBot();
});

// ── Discord bot child process ─────────────────────────────────────────────────
function spawnBot() {
  // In development the bot runs via its own workflow — skip to avoid port conflicts
  if (process.env["NODE_ENV"] !== "production") return;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Resolve relative to workspace root (two levels up from artifacts/api-server/dist/)
  const workspaceRoot = path.resolve(__dirname, "../../..");
  const botEntry = path.join(workspaceRoot, "artifacts/discord-bot/src/index.js");

  logger.info({ botEntry }, "Spawning Discord bot process");

  const bot = spawn("node", [botEntry], {
    env: { ...process.env, BOT_PORT: "3000" },
    stdio: "pipe",
  });

  bot.stdout?.on("data", (chunk: Buffer) => {
    logger.info({ src: "bot" }, chunk.toString().trim());
  });

  bot.stderr?.on("data", (chunk: Buffer) => {
    logger.warn({ src: "bot" }, chunk.toString().trim());
  });

  bot.on("exit", (code, signal) => {
    logger.warn({ code, signal }, "Discord bot exited — restarting in 5s");
    setTimeout(spawnBot, 5_000);
  });

  bot.on("error", (err) => {
    logger.error({ err }, "Failed to spawn Discord bot");
    setTimeout(spawnBot, 5_000);
  });
}
