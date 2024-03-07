import { ApplicationCommandType } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';
export default new Command({
	name: 'begin',
	description: 'Add an entry into the database to start earning gold',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { user } = interaction;

		// Check if the user already exists in the database
		try {
			const existingUser = await UserModel.findOne({ id: user.id });
			if (existingUser) {
				return interaction.reply({ content: 'You already have an entry in the database!', ephemeral: true });
			}

			// Create a new user entry with 0 balance
			const newUser = new UserModel({ id: user.id, username: user.username, balance: 0 });
			await newUser.save();

			await interaction.reply({ content: 'Welcome! You have been added to the database and can now start earning gold!', ephemeral: true });
		} catch (error) {
			console.error('Error creating user entry:', error);
			await interaction.reply({ content: 'Oops! Something went wrong while creating your entry. Please try again later.', ephemeral: true });
		}
	},
});