# Luvly Discord Bot

A social matchmaking Discord bot with aesthetic embeds, profile cards, matchmaking, chemistry tracking, anonymous confessions, midnight mode, and an XP/leveling system.

## Architecture

pnpm monorepo with three packages:
- `artifacts/discord-bot` — main Discord.js v14 bot (Node.js, ESM)
- `artifacts/api-server` — Express API server (optional)
- `artifacts/luvly-status` — React/Vite status page (optional)

## Bot Structure (`artifacts/discord-bot/src/`)

```
src/
├── index.js                  — entry point, client setup, event loading
├── config.js                 — colors, emojis, prefixes, XP levels, rizz lines
├── deploy-commands.js        — slash command registration script
├── commands/
│   ├── social/               — profile, card, help, theme
│   ├── matchmaking/          — match, crush
│   ├── midnight/             — midnight, comfort
│   ├── confession/           — confess
│   ├── chemistry/            — chemistry
│   ├── engagement/           — rank, leaderboard, shop, achievements, stats
│   ├── ai/                   — rizz
│   ├── safety/               — report
│   ├── hidden/               — ghost, miss, overthink, playlist
│   └── premium/              — premium (stub)
├── events/
│   ├── ready.js              — bot ready event
│   ├── messageCreate.js      — prefix command handler
│   └── interactionCreate.js  — slash commands + buttons + selects + modals
├── handlers/
│   ├── commandHandler.js     — loads all commands into client.commands map
│   └── componentHandler.js   — all button/select/modal interaction logic
├── middleware/
│   └── commandMiddleware.js  — spam gate + per-command cooldown
├── core/
│   └── slashAdapter.js       — converts slash interactions to prefix-style message objects
├── ui/
│   ├── embeds.js             — premium embed builders (profile, match, crush, etc.)
│   └── components.js         — reusable button/select component builders
├── utils/
│   ├── cooldown.js           — per-command cooldown + spam gate + button debounce
│   ├── database.js           — in-memory store with JSON persistence
│   ├── embeds.js             — base embed builder (luvEmbed, buildButtons, footer)
│   ├── achievements.js       — achievement unlock system
│   ├── levelUp.js            — XP level-up announcements
│   ├── cardGenerator.js      — @napi-rs/canvas profile card image generator
│   └── store.js              — JSON file store
└── themes/
    ├── index.js              — theme registry
    └── renderer.js           — canvas background renderer
```

## Key Features

- **Dual command system**: Prefix commands (`u profile`, `luv match`) + slash commands (`/profile`, `/match`)
- **Slash adapter**: `core/slashAdapter.js` converts slash interactions to the same interface as Messages, so all commands work with both systems
- **Button debounce**: 1.5s per-user per-button debounce prevents double-click spam
- **Premium UI module**: `ui/embeds.js` and `ui/components.js` with consistent aesthetic builders
- **In-memory + JSON persistence**: `utils/store.js` + `utils/database.js`
- **Profile card generation**: @napi-rs/canvas generates PNG cards with themes
- **XP & leveling system**: 10 levels with titles, XP bars, streak tracking
- **Anonymous confessions**: Modal-based, identity revealed only on explicit action
- **Chemistry tracking**: Per-pair chemistry scores with progress bars
- **Crush system**: Secret crush matching with mutual detection + DM notification
- **Achievement system**: 20+ achievements with unlock notifications

## Environment Variables Required

| Variable        | Required | Description |
|----------------|----------|-------------|
| `DISCORD_TOKEN` | ✅ Yes   | Bot token from Discord Developer Portal |
| `CLIENT_ID`     | For slash deploy | Application ID (for registering slash commands) |
| `GUILD_ID`      | Optional | Guild ID for instant slash command deploy (dev only) |

## Commands

### Slash Command Registration

After setting `DISCORD_TOKEN` and `CLIENT_ID`:
```bash
pnpm --filter @workspace/discord-bot run deploy
```

### Running the Bot

```bash
pnpm --filter @workspace/discord-bot run start
```

Or via Replit workflow: **Luvly Discord Bot**

## Prefix

Default prefixes: `u `, `luv ` (case-sensitive). Configured in `src/config.js`.

## Data Storage

All data stored in `data/` directory as JSON files (in-memory cache, flushed to disk). No external database required.

## Dependencies

- `discord.js` ^14 — Discord API client
- `@napi-rs/canvas` — Canvas-based profile card image generation
- `@fontsource/nunito` — Nunito font for cards
- `dotenv` — Environment variable loading
