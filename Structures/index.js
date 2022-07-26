const { Client, Partials, GatewayIntentBits, Collection } = require('discord.js');
const ms = require('ms');
const { promisify } = require('util');
const glob = require('glob');
const PG = promisify(glob);
const Ascii = require('ascii-table');

const config = require('./config');
const { mongoConnect } = require('../Database/index');

const { Channel, GuildMember, GuildScheduledEvent, Message, Reaction, ThreadMember, User } = Partials;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers
	],
	partials: [
		Channel, GuildMember,
		GuildScheduledEvent, Message,
		Reaction, ThreadMember,
		User
	],
	allowedMentions: { parse: ['everyone', 'roles', 'users'] },
	rest: { timeout: ms('1m') }
});

client.events = new Collection();
client.commands = new Collection();

const Handlers = ['Events', 'Commands', 'Errors'];
Handlers.forEach(handler => {
	require(`./Handlers/${handler}`)(client, PG, Ascii);
});
mongoConnect();
module.exports = client;

if (process.env.NODE_ENV === 'development') {
	client.login(config.DEV_DISCORD_BOT_TOKEN);
} else {
	client.login(config.DISCORD_BOT_TOKEN);
}