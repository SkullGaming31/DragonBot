import { ApplicationCommandType, MessageFlags } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'begin',
	description: 'Add an entry into the database to start earning gold',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Information',
	run: async ({ interaction }) => {
		try {
			const { user, guild } = interaction;

			// Check if the user already exists in the database for this guild
			const existingUser = await UserModel.findOne({ guildID: guild?.id, id: user.id });
			console.log(`${guild?.id} : ${user.username}`);
			if (existingUser) {
				return interaction.reply({ content: 'You already have an entry in the database!', flags: MessageFlags.Ephemeral });
			}

			// Create a new user entry with 0 balance
			const newUser = new UserModel({ guildID: guild?.id, id: user.id, username: user.username, balance: 0 });
			await newUser.save();

			return interaction.reply({ content: 'Welcome! You have been added to the database and can now start earning gold!', flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error('Error creating user entry:', error);
			return interaction.reply({ content: 'Oops! Something went wrong while creating your entry. Please try again later.', flags: MessageFlags.Ephemeral });
		}
	},
});