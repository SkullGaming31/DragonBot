import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'test',
	description: 'Testing commands with apis',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		//
		await interaction.reply({ content: 'This command is only used for testing out apis' });
	}
});
