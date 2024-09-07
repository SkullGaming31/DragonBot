import { ApplicationCommandType, EmbedBuilder, TextChannel } from 'discord.js';
import { Command } from '../../Structures/Command';
export default new Command({
	name: 'reaction',
	description: 'Create a message to assign your reaction roles too',
	UserPerms: ['ManageGuild'],
	BotPerms: ['AddReactions'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		// Create an embed message
		const embed = new EmbedBuilder()
			.setTitle('Role Assignment')
			.setDescription('React with one below to get the Role')
			.addFields([
				{
					name: 'Announcements',
					value: '📋'
				},
				{
					name: 'Space Engineers',
					value: '🚀'
				},
				{
					name: 'Palworld',
					value: '🧌'
				},
				{
					name: 'Vigor',
					value: '🔫'
				},
				{
					name: 'Warframe',
					value: '🥷'
				},
			])
			.setColor('Green');

			const textChannel = interaction.channel as TextChannel;

		// Send the embed message
		const message = await textChannel.send({ embeds: [embed] });

		// Add the rocket emoji reaction to the message
		await message?.react('📋');
		await message?.react('🚀');
		await message?.react('🧌');
		await message?.react('🔫');
		await message?.react('🥷');
	}
});