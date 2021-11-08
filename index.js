const { Client, Intents, Collection } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	],
});
client.commands = new Collection();

process.on('uncaughtException', error => {
	console.log(error);
});

process.on('unhandledRejection', error => {
	console.log(error);
});

// use to read commands from here but same issue that was having with loading events.
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

// used to load events from an events folder but was having issues with intelisense
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args, client));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args, client));
	}
}

client.login(process.env.TOKEN);