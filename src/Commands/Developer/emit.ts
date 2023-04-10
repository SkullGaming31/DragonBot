import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'emit',
	description: 'Emit an Event for testing',
	UserPerms: ['Administrator'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['Administrator'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'event',
			description: 'Guild Member Events',
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
					name: 'guildMemberUpdate',
					value: 'guildMemberUpdate'
				},
				{
					name: 'guildCreate',
					value: 'guildCreate'
				},
				{
					name: 'guildDelete',
					value: 'guildDelete'
				},
				{
					name: 'channelCreate',
					value: 'channelCreate'
				},
				{
					name: 'channelDelete',
					value: 'channelDelete'
				},
				{
					name: 'channelUpdate',
					value: 'channelUpdate'
				}
			]
		}
	],
	run: async ({ interaction, client }) => {
		const { options, member } = interaction;

		const choices = options.getString('event');

		switch (choices) {
		case 'guildMemberAdd':
			client.emit('guildMemberAdd', member);
			interaction.reply({ content: 'Emitted the event!', ephemeral: true });
			break;
		case 'guildMemberRemove':
			client.emit('guildMemberRemove', member);
			interaction.reply({ content: 'Emitted the event!', ephemeral: true });
			break;
		case 'guildMemberUpdate':
			// client.emit('guildMemberUpdate', member);
			interaction.reply({ content: 'Event not added!', ephemeral: true });
			break;
		case 'guildCreate':
			// client.emit('guildCreate', guild);
			interaction.reply({ content: 'Event not added!', ephemeral: true });
			break;
		case 'guildDelete':
			// client.emit('guildCreate', guild);
			interaction.reply({ content: 'Event Not Added!', ephemeral: true });
			break;
		case 'channelCreate':
			// client.emit('channelCreate', channel);
			interaction.reply({ content: 'Event Not Added!', ephemeral: true });
			break;
		}
	}
});