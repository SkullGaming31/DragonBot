const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');

module.exports = {
	name: 'ping',
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	/**
	* 
	* @param {CommandInteraction} interaction
	* @returns
	*/
	async execute(interaction) {
		const Bot = interaction.client.user.username;

		await interaction.deferReply();
		interaction.editReply({ content: `${Bot}'s ping is **${interaction.client.ws.ping}ms**` });
		// await interaction.reply({ content: 'Pong!' });
	},
};