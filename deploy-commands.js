const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.guildId;

const commands = [
	new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('mobile').setDescription('info to relay to overlay expert users').addUserOption(option => option.setName('target').setDescription('The user you want to mention')),
	new SlashCommandBuilder().setName('requests').setDescription('Request new features for Overlay Expert').addUserOption(option => option.setName('target').setDescription('The user you want to mention')),
	new SlashCommandBuilder().setName('get-help').setDescription('get help for an issue your having with overlay expert').addUserOption(option => option.setName('user').setDescription('the user you want to mention')),
	new SlashCommandBuilder().setName('kick').setDescription('kick a member from the server').addUserOption(option => option.setName('target').setDescription('the user in which to kick from the server').setRequired(true)),
	new SlashCommandBuilder().setName('ban').setDescription('ban a member from the server').addUserOption(option => option.setName('target').setDescription('the user you want to ban').setRequired(true)),
	new SlashCommandBuilder().setName('info').setDescription('Returns Info Based on input!').addSubcommand(subCommand => subCommand.setName('user').setDescription('Get Information of a user mentioned').addUserOption(option => option.setName('target').setDescription('the User Mentioned'))).addSubcommand(subCommand => subCommand.setName('server').setDescription('Get info about the server')),
	new SlashCommandBuilder().setName('mute').setDescription('mute a member from the server').addUserOption(option => option.setName('target').setDescription('the user you want to mute').setRequired(true)).addStringOption(option => option.setName('reason').setDescription('the reason for muting').setRequired(false)).addStringOption(option => option.setName('custom-time').setDescription('provide a custom time(1s,1m,1h,1d)').setRequired(false)),
	new SlashCommandBuilder().setName('unmute').setDescription('unmute a member').addUserOption(option => option.setName('target').setDescription('the user you want to unmute').setRequired(true)),
]
	.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
	try {
		rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
		// rest.delete(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
		console.log('Successfully reloaded application (/) commands.');
		// console.log('Successfully removed application (/) commands.');
	}
	catch (error) {
		console.error(error);
	}
})();