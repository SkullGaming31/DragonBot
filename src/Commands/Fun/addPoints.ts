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
			description: 'The target user to add points to',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'amount',
			description: 'The amount of points to give to the user',
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
			return interaction.reply({ content: 'Please enter a valid positive amount of points to add.', ephemeral: true });
		}

		// Check if the target user is a guild member
		const guildMember = guild?.members.cache.get(targetUser.id);
		if (!guildMember) {
			return interaction.reply({ content: 'The target user is not a member of this guild.', ephemeral: true });
		}

		try {
			// Find or create the target user in the database
			let user = await UserModel.findOne({ guildID: guild?.id, id: targetUser.id });
			if (!user) {
				user = new UserModel({
					guildID: guild?.id,
					id: targetUser.id,
					username: targetUser.username,
					balance: 0,
					inventory: [],
					cooldowns: {},
					AFKmessage: '',
					AFKstatus: null,
				});
			}

			// Update the user's balance
			user.balance += amount;

			// Save the updated user data
			await user.save();

			// Send confirmation message
			await interaction.reply({ content: `Successfully added ${amount} points to **${targetUser.username}**'s balance.`, ephemeral: false });
		} catch (error) {
			console.error('Error adding points:', error);
			await interaction.reply({ content: 'An error occurred while adding points. Please try again later.', ephemeral: true });
		}
	},
});