import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'removepoints',
	description: 'Remove points from a user',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'The target user to remove points from',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'amount',
			description: 'The amount of points to remove from the user',
			type: ApplicationCommandOptionType.Number,
			required: true
		}
	],
	run: async ({ interaction }) => {
		const { options, guild } = interaction;
		const targetUser = options.getUser('target');
		const amount = options.getNumber('amount');

		// Validate targetUser
		if (!targetUser) {
			console.error('Unexpected error: targetUser is null after non-null assertion.');
			return interaction.reply({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true });
		}

		// Validate amount
		if (amount === null || amount <= 0 || isNaN(amount)) {
			return interaction.reply({ content: 'Please enter a valid positive amount of points to remove.', ephemeral: true });
		}

		// Check if the target user is a guild member
		const guildMember = guild?.members.cache.get(targetUser.id);
		if (!guildMember) {
			return interaction.reply({ content: 'The target user is not a member of this guild.', ephemeral: true });
		}

		try {
			// Find the target user in the database
			const user = await UserModel.findOne({ guildID: guild?.id, id: targetUser.id });
			if (!user) {
				return interaction.reply({ content: 'The target user does not have an entry in the database.', ephemeral: true });
			}

			// Ensure the user has enough balance to remove the specified amount
			if (user.balance < amount) {
				return interaction.reply({ content: `you are trying to remove more gold then the user has. Current balance: ${user.balance}`, ephemeral: true });
			}

			// Update the user's balance
			user.balance -= amount;

			// Save the updated user data
			await user.save();

			// Send confirmation message
			await interaction.reply({ content: `Successfully removed ${amount} points from **${targetUser.username}**'s balance.`, ephemeral: false });
		} catch (error) {
			console.error('Error removing points:', error);
			await interaction.reply({ content: 'An error occurred while removing points. Please try again later.', ephemeral: true });
		}
	},
});