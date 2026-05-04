import { startSelfPing } from '../utils/keepAlive.js';

export default {
  name: 'ready',
  once: true,
  execute(client) {
    const tag     = client.user.tag;
    const guilds  = client.guilds.cache.size;
    const cmds    = client.commands?.size ?? 0;
    const aliases = client.aliases?.size  ?? 0;

    // ── Build the public ping URL ─────────────────────────────────────────────
    const domain   = process.env.REPLIT_DEV_DOMAIN ?? null;
    const pingUrl  = domain ? `https://${domain}/api/ping` : null;

    console.log('\n┌─────────────────────────────────────────────┐');
    console.log(`│  ✦ luvly is online                          │`);
    console.log(`│  tag     : ${tag.padEnd(33)}│`);
    console.log(`│  guilds  : ${String(guilds).padEnd(33)}│`);
    console.log(`│  commands: ${String(cmds).padEnd(33)}│`);
    console.log(`│  aliases : ${String(aliases).padEnd(33)}│`);
    if (pingUrl) {
    console.log(`│  ping    : ${pingUrl.slice(0, 33).padEnd(33)}│`);
    }
    console.log('└─────────────────────────────────────────────┘\n');

    if (pingUrl) {
      console.log('┌─────────────────────────────────────────────┐');
      console.log('│  ✦ UPTIME MONITOR — add this URL to         │');
      console.log('│    UptimeRobot / BetterUptime / etc.        │');
      console.log(`│  ${pingUrl.padEnd(43)}│`);
      console.log('└─────────────────────────────────────────────┘\n');

      startSelfPing(pingUrl);
    } else {
      console.log('✦ REPLIT_DEV_DOMAIN not set — self-ping skipped');
      console.log('  Add the URL of this Repl to an uptime monitor manually.\n');
    }

    client.user.setPresence({
      activities: [{ name: 'u rizz · luv match · u vibe', type: 2 }],
      status: 'dnd',
    });
  },
};
