export default {
  name: 'ready',
  once: true,
  execute(client) {
    const tag     = client.user.tag;
    const guilds  = client.guilds.cache.size;
    const cmds    = client.commands?.size ?? 0;
    const aliases = client.aliases?.size  ?? 0;

    console.log('\n┌─────────────────────────────────────┐');
    console.log(`│  ✦ luvly is online                  │`);
    console.log(`│  tag     : ${tag.padEnd(25)}│`);
    console.log(`│  guilds  : ${String(guilds).padEnd(25)}│`);
    console.log(`│  commands: ${String(cmds).padEnd(25)}│`);
    console.log(`│  aliases : ${String(aliases).padEnd(25)}│`);
    console.log('└─────────────────────────────────────┘\n');

    client.user.setPresence({
      activities: [{ name: 'u rizz · luv match · u vibe', type: 2 }],
      status: 'dnd',
    });
  },
};
