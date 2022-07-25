const { Client, Intents, Collection } = require('discord.js');
const { promisify } = require('util');
const glob = require('glob');
const PG = promisify(glob);
const Ascii = require('ascii-table');
const config = require('./config');
const { getRepos } = require('../github/index');

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

require('../handlers/Anit-Crash')(client);

/* ['ChatFilterSys', 'LockdownSys'].forEach((system) => {
	require(`../Structures/Systems/${system}`)(client);
}); */

['Events', 'Commands'].forEach((handler) => {
	require(`../handlers/${handler}`)(client, PG, Ascii);
});

if (process.env.NODE_ENV === 'development') {
	client.login(process.env.DEV_DISCORD_BOT_TOKEN);
} else {
	client.login(config.DISCORD_BOT_TOKEN);
}