/* eslint-disable indent */
const { Client, ChatInputCommandInteraction, ApplicationCommandOptionType } = require('discord.js');
module.exports = {
	name: 'emit',
	description: 'Emit an Event for testing',
	category: 'Developer',
	UserPerms: ['Administrator'],
	BotPerms: ['ManageGuilds'],
	options: [
		{
			name: 'event',
			description: 'Events to be sent',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'guildMemberAdd',
					value: 'guildMemberAdd',
				},
				{
					name: 'guildMemberRemove',
					value: 'guildMemberRemove'
				},
				{
					name: 'guildCreate',
					value: 'guildCreate'
				},
				{
					name: 'guildDelete',
					value: 'guildDelete'
				}
			]
		}
	],
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 * @param {Client} client
	 */
	async execute(interaction, client) {
		const { options } = interaction;

		const choices = options.getString('event');

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
	}
};