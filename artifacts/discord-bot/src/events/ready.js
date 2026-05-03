export default {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`\n✦ luvly is online as ${client.user.tag}`);
    console.log(`✦ serving ${client.guilds.cache.size} server(s)`);
    client.user.setPresence({
      activities: [{ name: 'u rizz · luv match · u vibe', type: 2 }],
      status: 'dnd',
    });
  },
};
