const { Client, Intents, Collection, MessageEmbed } = require('discord.js');
require('dotenv').config();
const fs = require('fs');
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_INVITES,
	],
});
client.commands = new Collection();

process.on('uncaughtException', (error) => {
	console.log(error);
});
  
process.on('unhandledRejection', (error) => {
	console.log(error);
});

client.on('interactionCreate', async (interaction) => {// commands are done in this code block
	if (interaction.channel.type === 'DM') return;
	console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
	if (!interaction.isCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName); // this will read commands from there own .js file

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
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