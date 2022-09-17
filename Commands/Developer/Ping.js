const { Client, ChatInputCommandInteraction } = require('discord.js');
const Reply = require('../../Systems/reply');
module.exports = {
	name: 'ping',
	description: 'sends back your ping',
	category: 'Developer',
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		const { user } = interaction;
		if (user.id !== '353674019943219204') return Reply(interaction, '❌', 'this is a developer command only');
		return Reply(interaction, '⏳', `the current websocket latency is: \`${client.ws.ping} ms\``, true);
	}
};