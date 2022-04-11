const { CommandInteraction, Client } = require('discord.js');
module.exports = {
	name: 'emitt',
	description: 'an Event Emitter for developers to test bits of code',
	permission: 'MANAGE_GUILD',
	options: [
		{
			name: 'event',
			description: 'Guild Member Events',
			type: 'STRING',
			required: true,
			choices: [
				{
					name: 'guildMemberAdd',
					value: 'guildMemberAdd',
				},
				{
					name: 'guildMemberRemove',
					value: 'guildMemberRemove',
				},
			],
		},
	],
	/**
	 *
	 * @param {CommandInteraction} interaction
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		const choices = interaction.options.getString('event');
		switch (choices) {
			case 'guildMemberAdd':
				client.emit('guildMemberAdd', interaction.member);
				interaction.reply({ content: 'emitted the event!', ephemeral: true });
				break;
			case 'guildMemberRemove':
				client.emit('guildMemberRemove', interaction.member);
				interaction.reply({ content: 'emitted the event!', ephemeral: true });
				break;
		}
	},
};