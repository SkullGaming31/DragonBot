import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'chatgpt',
	description: 'Talk to GPT Bob',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		await interaction.reply({ content: 'under construction', ephemeral: true });
	}
});