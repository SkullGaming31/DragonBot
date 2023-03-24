import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'emit',
	description: 'Emit an Event for testing',
	UserPerms: ['Administrator'],
	BotPerms: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'member',
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
					name: 'channelCreate',
					value: 'channelCreate'
				}
			]
		}
	],
	run: async ({ interaction, client }) => {
		const { options, member } = interaction;

		const choices = options.getString('member');

		switch (choices) {
		case 'guildMemberAdd':
			client.emit('guildMemberAdd', member);
			interaction.reply({ content: 'Emitted the event!', ephemeral: true });
			break;
		case 'guildMemberRemove':
			client.emit('guildMemberRemove', member);
			interaction.reply({ content: 'Emitted the event!', ephemeral: true });
			break;
		}
	}
});