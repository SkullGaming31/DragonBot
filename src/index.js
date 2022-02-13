const { Client, Intents, Collection } = require('discord.js');
const fs = require('fs');
const config = require('./config');

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS ] });
client.commands = new Collection();

const commandFolders = fs.readdirSync('src/commands');
for (const folder of commandFolders) {
	const commandFiles = fs.readdirSync(`src/commands/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command = require(`./commands/${folder}/${file}`);
		client.commands.set(command.name, command);
	}
}

const eventFolders = fs.readdirSync('src/events');
for (const folder of eventFolders) {
	const eventFiles = fs.readdirSync(`src/events/${folder}`).filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		const event = require(`./events/${folder}/${file}`);
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args, client));
		} else {
			client.on(event.name, (...args) => event.execute(...args, client));
		}
	}
}
client.login(config.DISCORD_BOT_TOKEN);