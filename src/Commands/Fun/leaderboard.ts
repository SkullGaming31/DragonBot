import { ApplicationCommandType, Collection, EmbedBuilder, GuildMember } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';

import SettingsModel from '../../Database/Schemas/settingsDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'leaderboard',
	description: 'Show the Leaderboards for the most amount of balance',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		try {
			const { guild } = interaction;
			const settings = await SettingsModel.findOne({ GuildID: guild?.id }); // Assuming settings data is stored in a single document

			if (!settings) {
				return await interaction.reply({ content: 'Settings data not found.' });
			}

			const adminRoleId = settings.AdministratorRole;
			const moderatorRoleId = settings.ModeratorRole;

			if (!adminRoleId || !moderatorRoleId) {
				return await interaction.reply({ content: 'Missing admin or moderator role ID in settings.' });
			}

			const adminMembers = guild?.members.cache.filter((member) => member.roles.cache.has(adminRoleId));
			const moderatorMembers = guild?.members.cache.filter((member) => member.roles.cache.has(moderatorRoleId));
			const combinedAdminAndModMembers = adminMembers?.concat(moderatorMembers as Collection<string, GuildMember>);

			const nonAdminAndModUserIds = guild?.members.cache.filter((member) => !combinedAdminAndModMembers?.some((adminOrMod) => adminOrMod.id === member.id)).map((member) => member.id);

			const leaderboard = await UserModel.find({ id: { $in: nonAdminAndModUserIds } }) // Filter by user IDs
				.sort({ balance: -1 }) // Sort by balance in descending order
				.limit(10) // Limit to top 10 users
				.select({ id: 1, username: 1, balance: 1 }); // Optimize fields for performance

			if (leaderboard.length === 0) {
				return await interaction.reply({ content: 'There are no users in the database yet!' });
			}

			const embed = new EmbedBuilder()
				.setTitle(' Top 10 Gold Leaders ') // Updated title
				.setColor('Green'); // Optional color

			let i = 1;
			for (const user of leaderboard) {
				const balanceValue = user.balance ?? 0; // Use 0 if balance is undefined
				embed.addFields([{ name: `${i++}. ${user.username}`, value: `Balance: ${balanceValue}` }]);
			}

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			await interaction.reply({ content: 'Failed to retrieve the leaderboard. Please try again later.' });
		}
	},
});