# Luvly Bot — Architect's Roadmap

> Ranked by impact / effort ratio. Ship top rows first.

## ✅ Already Implemented (this session)

| System | What was done |
|---|---|
| **Store layer** | In-memory store, disk flush every 10s, graceful shutdown — eliminated per-op disk I/O |
| **Cooldown system** | Per-command cooldowns + burst spam gate (4 cmds / 3s) |
| **Achievement engine** | 20 achievements, DM on unlock, XP + heart rewards |
| **Heart economy** | Hearts earned from daily, achievements, streaks. Spendable in shop |
| **Shop** | 9 items across aura, boost, collectible, utility categories |
| **Level-up announcer** | DM + channel ping on level change |
| **Blocked users** | Block list enforced across all targeted commands |
| **Confession system** | Anonymous + reveal flow with modal input |
| **Profile views** | Counter on profile, feeds into achievements |
| **Safety / report** | Mod-log forwarding, block command |
| **Stats command** | Live server/user/uptime/memory stats |
| **Leaderboard** | Hearts + achievement count shown alongside XP |
| **getTopAdmirer fix** | Fixed the ID string-replace bug |
| **Memory sweeper** | Message cache auto-swept every 5 min |

---

## 🔴 P0 — Ship within a week

### 1. PostgreSQL migration
Replace JSON store with a real DB. Use the existing Replit PostgreSQL setup.
`drizzle-orm` schema: `users`, `chemistry`, `crushes`, `confessions`, `inventory`, `achievements`, `blocks`.
**Why:** JSON files do not survive server restarts cleanly. Data loss risk is high.

### 2. DM streak-break reminders
```js
// Cron: every hour, scan for users where (now - lastDaily) > 22h
// DM them: "your streak is about to break 🔥 — claim your daily!"
```
**Why:** OwO Bot does this. It's the #1 daily retention driver.

### 3. Server-level confession channel
Allow admins to set a `#confessions` channel where anonymous posts appear automatically.
```
u setconfess #channel
```
**Why:** Makes confessions visible to the community — viral loop.

---

## 🟠 P1 — High impact, plan next sprint

### 4. Duo system
Two users can become a "duo" — linked profiles, shared chemistry display, duo badge.
```
u duo @user  →  request
u duo accept →  confirm
u duo stats  →  shared stats embed
```

### 5. Seasonal events
Weekly rotating challenges with bonus XP and exclusive collectibles.
```js
const CURRENT_EVENT = { name: 'valentine week', bonusMultiplier: 2, specialItem: 'golden_heart' };
```

### 6. Weekly server leaderboard cron
Every Sunday, auto-post the top 5 to a configured channel with ping.
```
u setlb #channel  →  admin sets destination
```

### 7. Slash command hybrid
Add `/luvly` slash command as an entry point alongside prefix.
Discord increasingly limits message content intent for unverified bots.

---

## 🟡 P2 — Monetization foundation

### 8. Premium tier gating
```js
export function isPremium(userId) {
  return getUser(userId).tier === 'premium';
}
// Gate: animated auras, advanced analytics, unlimited confessions/day
```

### 9. Stripe / Ko-fi integration
Link a payment URL to the `u premium` command. Track `premiumSince` in DB.

### 10. Gift hearts command
```
u gift @user 50
```
Peer-to-peer heart transfers — drives engagement and social proof.

---

## 🟢 P3 — Polish & retention ceiling

### 11. Message XP (passive)
Give 2 XP per message (not command), max 30 per hour per user.
```js
// in messageCreate, after prefix check fails:
// passive XP with per-hour bucket
```

### 12. Reaction tracking for chemistry
When user A reacts to user B's message → +1 chemistry automatically.

### 13. `u wrap` — yearly recap
End-of-year stat summary per user (OwO-style).

### 14. Webhook-based admin dashboard
Simple Express page showing: total users, daily actives, top commands used.

---

## Architecture Notes

**Why we beat OwO Bot:**
- OwO has no emotional layer. Luvly owns the emotional category entirely.
- Confession + midnight + crush reveal = viral loops OwO doesn't have.
- Heart economy creates a reason to come back daily even without a grind goal.

**Scaling ceiling with current stack:**
- JSON store: ~500 users before slowdown risk. Migrate to Postgres at 100+ DAU.
- Discord.js v14 + Node 20: handles ~10k events/sec easily on a single process.
- If you need multi-server sharding: `discord.js ShardingManager` drops in at 2500+ guilds.
