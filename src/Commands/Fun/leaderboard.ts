import { ApplicationCommandType, Collection, EmbedBuilder, GuildMember, channelMention } from 'discord.js';
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
			const { guild, channel } = interaction;
			const settings = await SettingsModel.findOne({ GuildID: guild?.id }); // Assuming settings data is stored in a single document
			// const userDoc = await UserModel.findOne({ guildID: guild?.id });

			if (!settings || settings.EconChan === undefined) return interaction.reply({ content: 'Settings data not found.' });

			const adminRoleId = settings.AdministratorRole;
			const moderatorRoleId = settings.ModeratorRole;

			if (!adminRoleId || !moderatorRoleId) return interaction.reply({ content: 'Missing admin or moderator role ID in settings.' });

			const adminMembers = guild?.members.cache.filter((member) => member.roles.cache.has(adminRoleId));
			const moderatorMembers = guild?.members.cache.filter((member) => member.roles.cache.has(moderatorRoleId));
			const combinedAdminAndModMembers = adminMembers?.concat(moderatorMembers as Collection<string, GuildMember>);

			const nonAdminAndModUserIds = guild?.members.cache.filter((member) => !combinedAdminAndModMembers?.some((adminOrMod) => adminOrMod.id === member.id)).map((member) => member.id);

			const leaderboard = await UserModel.find({ guildID: guild?.id, id: { $in: nonAdminAndModUserIds } })
				.sort({ balance: -1 }) // Sort by balance in descending order
				.limit(10) // Limit to top 10 users
				.select({ id: 1, username: 1, balance: 1 }); // Optimize fields for performance

			if (leaderboard.length === 0) return interaction.reply({ content: 'There are no users in the database yet!' });

			const embed = new EmbedBuilder()
				.setTitle(' Top 10 Gold Leaders ')
				.setColor('Green');

			let i = 1;
			for (const user of leaderboard) {
				const balanceValue = user.balance ?? 0; // Use 0 if balance is undefined
				embed.addFields([{ name: `${i++}. ${user.username}`, value: `Balance: ${balanceValue}` }]);
			}
			const economyChannel = guild?.channels.cache.get(settings.EconChan);
			if (economyChannel) {
				if (economyChannel.id !== channel?.id) {
					// If an economy channel is set and it's not the current channel:
					return interaction.reply({ content: `Please use the ${channelMention(economyChannel?.id)} channel for economy commands.`, ephemeral: true });
				} else {
					// If it's the correct channel, send the leaderboard
					await interaction.reply({ embeds: [embed] });
				}
			} else {
				// If no economy channel is set, send it in the current channel
				await interaction.reply({ embeds: [embed] });
			}
			// await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			await interaction.reply({ content: 'Failed to retrieve the leaderboard. Please try again later.' });
		}
	},
});