import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';
export default new Command({
	name: 'addpoints',
	description: 'Give points to a user',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'The target you want to add points too',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'amount',
			description: 'The amount you want to give the user',
			type: ApplicationCommandOptionType.Number,
			required: true
		}
	],
	run: async ({ interaction }) => {
		const { options } = interaction;
		const TargetUser = options.getUser('target');
		const Amount = options.getNumber('amount') || 0;

		if (!TargetUser) { // Check if targetUser is still null after assertion (shouldn't be)
			// Handle unexpected error or edge case (optional)
			console.error('Unexpected error: targetUser is null after non-null assertion.');
			return interaction.reply({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true, });
		}

		if (Amount <= 0) {
			return interaction.reply({ content: 'Please enter a positive amount of points to add.', ephemeral: true });
		}
		if (typeof Amount !== 'number' || isNaN(Amount)) {
			return interaction.reply({ content: 'Please enter a valid number of points to add.', ephemeral: true });
		}

		// Check if the target user is a guild member
		const guildMember = interaction.guild?.members.cache.get(TargetUser?.id);
		if (!guildMember) {
			return interaction.reply({ content: 'The target user is not a member of this guild.', ephemeral: true, });
		}

		try {
			// Find or create the target user in the database
			let user = await UserModel.findOne({ id: TargetUser?.id });
			if (!user) {
				user = new UserModel({ id: TargetUser?.id, username: TargetUser?.username, balance: Amount });
			}

			// Update the user's balance
			user.balance += Amount;

			// Save the updated user data
			await user.save();

			// Send confirmation message
			await interaction.reply({ content: `Successfully added ${Amount} points to **${TargetUser?.username}**'s balance.`, ephemeral: false });
		} catch (error) {
			console.error('Error adding points:', error);
			await interaction.reply({ content: 'An error occurred while adding points. Please try again later.', ephemeral: true });
		}
	},
});