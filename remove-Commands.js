require('dotenv').config();

const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.guildId;
    
const rest = new REST({ version: '9' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
	.then(data => {
		const promises = [];
		for (const command of data) {
			const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
			promises.push(rest.delete(deleteUrl));
		}
		console.log('Successfully removed application (/) commands.');
		return Promise.all(promises);
	});