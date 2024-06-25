import { ApplicationCommandOptionType, ApplicationCommandType, Collection, EmbedBuilder, GuildMember, channelMention } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'leaderboard',
	description: 'Show the Leaderboards for the most amount of balance',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	options: [
		{
			name: 'limit',
			description: 'The amount of users to show on the leaderboard',
			type: ApplicationCommandOptionType.Integer,
			required: true
		}
	],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		try {
			const { guild, channel, options } = interaction;
			const settings = await SettingsModel.findOne({ GuildID: guild?.id });

			if (!settings || settings.EconChan === undefined) {
				return interaction.reply({ content: 'Settings data not found.', ephemeral: true });
			}

			const adminRoleId = settings.AdministratorRole;
			const moderatorRoleId = settings.ModeratorRole;
			const limit = options.getInteger('limit');

			if (!limit || isNaN(limit) || limit <= 0) {
				return interaction.reply({ content: 'Please provide a valid number for the limit.', ephemeral: true });
			}

			if (!adminRoleId || !moderatorRoleId) {
				return interaction.reply({ content: 'Missing admin or moderator role ID in settings.', ephemeral: true });
			}

			const adminMembers = guild?.members.cache.filter((member) => member.roles.cache.has(adminRoleId));
			const moderatorMembers = guild?.members.cache.filter((member) => member.roles.cache.has(moderatorRoleId));
			const combinedAdminAndModMembers = adminMembers?.concat(moderatorMembers as Collection<string, GuildMember>);

			const nonAdminAndModUserIds = guild?.members.cache.filter((member) => !combinedAdminAndModMembers?.some((adminOrMod) => adminOrMod.id === member.id)).map((member) => member.id);

			const leaderboard = await UserModel.find({ guildID: guild?.id, id: { $in: nonAdminAndModUserIds } })
				.sort({ balance: -1 }) // Sort by balance in descending order
				.limit(limit) // Limit the number of users shown on the leaderboard
				.select({ id: 1, username: 1, balance: 1 }); // Optimize fields for performance

			if (leaderboard.length === 0) {
				return interaction.reply({ content: 'There are no users in the database yet!', ephemeral: true });
			}

			const embed = new EmbedBuilder().setTitle('Top Gold Leaders').setColor('Gold');

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
				}
			}

			// Send the leaderboard in the correct channel
			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			await interaction.reply({ content: 'Failed to retrieve the leaderboard. Please try again later.', ephemeral: true });
		}
	},
});