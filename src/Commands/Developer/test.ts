import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'test',
	description: 'Testing commands with API\'s',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		//
		await interaction.reply({ content: 'This command is only used for testing out API Responses', ephemeral: true });
	}
});
