const { Client, Partials, Collection, GatewayIntentBits } = require('discord.js');
const ms = require('ms');
const { promisify } = require('util');
const glob = require('glob');
const PG = promisify(glob);
const Ascii = require('ascii-table');

const config = require('./config');

const { Channel, GuildMember, GuildScheduledEvent, Message, Reaction, ThreadMember, User } = Partials;

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
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

const Handlers = ['Events', 'Commands', /* 'Errors' */];
Handlers.forEach(handler => {
	require(`./Handlers/${handler}`)(client, PG, Ascii);
});

module.exports = client;

if (process.env.NODE_ENV === 'development') {
	client.login(config.DEV_DISCORD_BOT_TOKEN);
} else {
	client.login(config.DISCORD_BOT_TOKEN);
}