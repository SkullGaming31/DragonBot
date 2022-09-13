/* eslint-disable indent */
const { ChatInputCommandInteraction, Client, ApplicationCommandOptionType } = require('discord.js');
const Reply = require('../../Systems/reply');
module.exports = {
	name: 'emitt',
	description: 'Testing client events',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	Category: 'Developer',
	options: [
		{
			name: 'events',
			description: 'event to trigger',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'guildMemberAdd', value: 'guildMemberAdd' },
				{ name: 'guildMemberRemove', value: 'guildMemberRemove' },
				{ name: 'guildMemberUpdate', value: 'guildMemberUpdate' }
			]
		}
	],
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction
	 * @param {Client} client 
	 */
	async execute(interaction, client) {
		const { user, options } = interaction;
		const { emit } = client;

		const Event = options.getString('events');

		if (user.id !== '353674019943219204') return Reply(interaction, '❌', 'you must be the Bot Developer to use this command');

		switch (Event) {
			case 'guildMemberAdd':
				client.emit('guildMemberAdd', interaction.member);
				await interaction.reply({ content: 'Emitted the event', ephemeral: true });
				break;
			case 'guildMemberRemove':
				client.emit('guildMemberRemove', interaction.member);
				await interaction.reply({ content: 'Emitted the event', ephemeral: true });
				break;
			case 'guildMemberUpdate':
				client.emit('guildMemberUpdate', interaction.member);
				await interaction.reply({ content: 'Emitted the event', ephemeral: true });
				break;
		}
	}
};