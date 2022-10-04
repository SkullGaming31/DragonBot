import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
// import DB from '../../Structures/Schemas/WarnDB';

export default new Command({
	name: 'warn',
	description: 'Shows user warnings',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'Select a target',
			type: ApplicationCommandOptionType.User,
			required: false
		},
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options } = interaction;
		const Target = options.getUser('target');

		if (Target && Target !== null) {
			await interaction.reply({ content: `${Target}, This command is Currently being worked on`, ephemeral: true });
		} else {
			interaction.reply({ content: 'Command under Construction', ephemeral: true });
		}
	}
});