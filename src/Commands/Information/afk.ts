import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import { Command } from '../../Structures/Command';
import { error as logError } from '../../Utilities/logger';
import { IUser, UserModel } from '../../Database/Schemas/userModel';

export default new Command({
	name: 'afk',
	description: 'Leave an afk message in case someone tags you while you are away',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Information',
	options: [
		{
			name: 'message',
			description: 'The message you want to reply to people when you are tagged (Required)',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],

	run: async ({ interaction }) => {
		try {
			const { options, user, guild } = interaction;
			const message = options.getString('message')!; // Use non-null assertion

			// Find user data or create a new entry if not found
			let afkData: IUser | null = await UserModel.findOne<IUser>({ guildID: guild?.id, id: user.id });
			if (!afkData) {
				afkData = new UserModel({ guildID: guild?.id, id: user.id, AFKmessage: message }); // Set message during creation
			} else {
				afkData.AFKmessage = message; // Update message if user data exists
			}

			afkData.AFKstatus = null;
			await afkData.save();

			await interaction.reply({ content: 'AFK message set! I will reply with your message if you are tagged. Your AFK message will clear when you send a message in this server.', flags: MessageFlags.Ephemeral });
		} catch (error) {
			logError('AFK command failed', { error: (error as Error)?.message ?? error });
		}
	},
});