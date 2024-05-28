import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, channelMention, userMention } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

// Define roles for moderators and/or admins (adjust as needed)
// const moderatorRoles = ['Mod', 'Admin'];

export default new Command({// TODO: Unable to retrieve server settings
	name: 'bal',
	description: 'Check the balance of your account or another user (if you have permission)',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'Tag a user to check there balance(Moderator, Admin Only option)',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	run: async ({ interaction }) => {
		try {
			const { user, options, guild, channel } = interaction;

			// Check if the user is attempting to check another user's balance
			const targetUser = options.getUser('target');

			// Use interaction.member directly to consistently represent the command user
			const commandUser = interaction.member;

			// Check if the command user is the server owner (no need for serverMember here)
			const isOwner = commandUser?.id === guild?.ownerId;

			const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });
			let economyChannel;
			if (settingsDoc && settingsDoc.EconChan) {
				economyChannel = guild?.channels.cache.get(settingsDoc.EconChan);
			} else {
				// No economy channel set, use the command channel
				economyChannel = interaction.channel;
			}
			if (economyChannel) {
				if (economyChannel?.id !== channel?.id) {
					return interaction.reply({ content: `${userMention(user.id)}, You can only use this command in the economy spam channel ${channelMention(economyChannel.id)}`, ephemeral: true });
				}
			}

			const guildSettings = await SettingsModel.findOne({ GuildID: guild?.id });

			// Ensure guild settings exist

			// Check if the user is in the guild to access their roles
			if (targetUser && !guild) return interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });

			if (!guildSettings) return interaction.reply({ content: 'Unable to retrieve server settings, please run the ``/settings`` command', ephemeral: true });
			// Assert only if certain values will be strings:
			const adminRoleId = guildSettings.AdministratorRole as string;
			const modRoleId = guildSettings.ModeratorRole as string;

			// Check if the user has either role
			const hasPermission = isOwner || interaction.member.roles.cache.has(adminRoleId) || interaction.member.roles.cache.has(modRoleId);

			// if (!hasPermission) {
			// Roles are missing or user lacks permissions
			// 	return interaction.reply({ content: 'Admin or Moderator roles are required for this functionality. Please ensure those roles are configured correctly in the server settings.``/settings``', ephemeral: true });
			// }

			if (targetUser && !hasPermission) {
				return interaction.reply({ content: 'You don\'t have permission to check other users\' balances.', ephemeral: true });
			}

			// Find the user in the database (target user or the original user)
			const userId = targetUser?.id || user.id;
			// console.log('Searching for user with ID:', userId);
			const userDoc = await UserModel.findOne({ guildID: guild?.id, id: userId });
			// console.log('Retrieved user document:', userDoc);
			if (!userDoc) {
				const message = `${targetUser ? userMention(targetUser.id) : 'You'} don't have an entry in the database yet. Use the \`/begin\` command to register!`;
				return interaction.reply({ content: message, ephemeral: true });
			}

			const targetUsername = targetUser ? targetUser.username : user.username;

			// Get all user balances, sorted by balance (descending)
			const allUserBalances = await UserModel.find({ guildID: guild?.id }).sort({ balance: -1 }).select('balance');
			// Get the rank of the current user's balance within the sorted list
			const userRank = allUserBalances.findIndex(doc => doc.balance === userDoc.balance) + 1;

			const embed = new EmbedBuilder()
				.setTitle(`${targetUsername}'s Account Stats`)
				.setColor('Green')
				.addFields([
					{
						name: 'Balance',
						value: `${userDoc.balance || '0'} gold`, // Use "0" or a better default if balance is undefined
						inline: true
					},
					{
						name: 'Inventory',
						value: `${userDoc.inventory?.length ? userDoc.inventory.join('\n') : 'Empty'}`, // Check length and join if exists, otherwise show "Empty"
						inline: true
					},
					{
						name: 'Rank',
						value: `${userRank}`,
						inline: true
					}
				])
				.setFooter({ text: `${guild?.name}` })
				.setTimestamp();

			if (targetUser) {
				embed.setThumbnail(targetUser.displayAvatarURL({ size: 512 }));
			} else {
				embed.setThumbnail(user.displayAvatarURL({ size: 512 }));
			}

			// const balanceMessage = `**${targetUsername}'s current balance is: **${userDoc.balance} gold`;
			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error fetching user balance:', error);
			await interaction.reply({ content: 'Oops! Something went wrong while checking the balance. Please try again later.', ephemeral: true });
		}
	},
});
