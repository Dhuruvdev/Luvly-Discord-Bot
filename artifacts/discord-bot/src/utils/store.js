/**
 * In-memory store with debounced write-through persistence.
 * REPLACES the old load/save pattern.
 *
 * Old pattern: full JSON read → mutate → full JSON write on EVERY operation.
 * New pattern: load once into memory on first access → mutate in-memory → flush
 *              to disk every FLUSH_INTERVAL ms (or on graceful shutdown).
 *
 * Result: 0 disk I/O during hot paths. One write per flush cycle.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = join(__dirname, '../data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const RAM   = {};
const DIRTY = new Set();
const FLUSH_INTERVAL = 10_000;

function diskPath(file) {
  return join(DATA_DIR, `${file}.json`);
}

function loadFromDisk(file) {
  const p = diskPath(file);
  if (!existsSync(p)) return {};
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; }
}

function flushToDisk(file) {
  try {
    writeFileSync(diskPath(file), JSON.stringify(RAM[file], null, 2));
  } catch (e) {
    console.error(`[store] flush failed for ${file}:`, e.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getTable(file) {
  if (!RAM[file]) RAM[file] = loadFromDisk(file);
  return RAM[file];
}

export function markDirty(file) {
  DIRTY.add(file);
}

export function forceFlush() {
  for (const file of DIRTY) flushToDisk(file);
  DIRTY.clear();
}

// periodic auto-flush
setInterval(() => {
  for (const file of DIRTY) flushToDisk(file);
  DIRTY.clear();
}, FLUSH_INTERVAL).unref();

// graceful shutdown hooks
function shutdown() {
  console.log('\n✦ flushing data to disk...');
  forceFlush();
  process.exit(0);
}
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err);
  forceFlush();
});
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});
