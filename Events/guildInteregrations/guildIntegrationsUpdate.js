const { MessageEmbed, CommandInteraction } = require('discord.js');
module.exports = {
	name: 'guildIntegrationsUpdate',
	/**
   * 
   * @param {CommandInteraction} interaction 
   */

	async execute(interaction) {
		const { guild } = interaction;
		await guild.fetchIntegrations();
		
		console.log('Testing');
	}
};