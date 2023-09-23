import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'get-help',
	description: 'get help for an issue your having',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['Administrator'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		await interaction.reply({ content: 'Under Construction.', ephemeral: true });
	}
});