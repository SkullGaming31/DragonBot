const { MessageEmbed, CommandInteraction } = require('discord.js');
module.exports = {
	name: 'guildIntegrationsUpdate',
	/**
   * 
   * @param {CommandInteraction} interaction 
   */

	async execute(interaction) {
		const { guild } = interaction;
		const tbd = await guild.fetchIntegrations();
		
		console.log(tbd);
	}
};