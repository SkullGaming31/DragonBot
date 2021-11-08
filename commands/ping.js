const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Client } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	/**
	* 
	* @param {CommandInteraction} interaction
	* @returns
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const Bot = interaction.client.user.username;
		await interaction.reply(`${Bot}'s ping is ${interaction.client.ws.ping}`);
	},
};