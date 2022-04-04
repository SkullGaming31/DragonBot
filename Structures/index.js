const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const { promisify } = require('util');
const glob = require('glob');
const PG = promisify(glob);
const Ascii = require('ascii-table');
const config = require('./config');

require('../database/index');

const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MEMBERS
	]
});
client.commands = new Collection();
client.buttons = new Collection();
client.filters = new Collection();
client.filtersLog = new Collection();

/* ['ChatFilterSys', 'LockdownSys'].forEach((system) => {
	require(`../Structures/Systems/${system}`)(client);
}); */

['Events', 'Commands'].forEach(handler => {
	require(`../handlers/${handler}`)(client, PG, Ascii);
});


client.login(config.DISCORD_BOT_TOKEN);