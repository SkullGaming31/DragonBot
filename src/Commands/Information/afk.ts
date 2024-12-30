import { ApplicationCommandOptionType, ApplicationCommandType, PresenceStatusData } from 'discord.js';
import { Command } from '../../Structures/Command';
import { IUser, UserModel } from '../../Database/Schemas/userModel';

// FIX: Setting user Presence does not work.

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
		{
			name: 'status',
			description: 'Status for your user account (Optional)',
			type: ApplicationCommandOptionType.String,
			choices: [
				{ name: 'online', value: 'online' },
				{ name: 'idle', value: 'idle' },
				{ name: 'dnd', value: 'dnd' },
				{ name: 'invisible', value: 'invisible' },
			],
		},
	],

	run: async ({ interaction }) => {
		try {
			const { options, user, guild } = interaction;
			const message = options.getString('message')!; // Use non-null assertion
			const status = options.getString('status') || null; // Set status to null if not provided

			// Find user data or create a new entry if not found
			let afkData: IUser | null = await UserModel.findOne<IUser>({ guildID: guild?.id, id: user.id });
			if (!afkData) {
				afkData = new UserModel({ guildID: guild?.id, id: user.id, AFKmessage: message }); // Set message during creation
			} else {
				afkData.AFKmessage = message; // Update message if user data exists
			}

			afkData.AFKstatus = status as PresenceStatusData | null;
			await afkData.save();

			// Set user's status if status is not null
			if (status !== null) {
				const userMember = await guild?.members.fetch({ withPresences: true, user: user.id });
				if (userMember) {
					let presenceStatus: PresenceStatusData;
					switch (status) {
						case 'online':
							presenceStatus = 'online';
							break;
						case 'idle':
							presenceStatus = 'idle';
							break;
						case 'dnd':
							presenceStatus = 'dnd';
							break;
						case 'invisible':
							presenceStatus = 'invisible';
							break;
						default:
							presenceStatus = 'online'; // Default to 'online' if status is not recognized
					}
					// client?.user?.setPresence({ activities: [], status: presenceStatus });
					if (userMember.presence) {
						userMember.presence.status = presenceStatus; // Assign only if presence exists
					} else {
						console.log('something happened');
					}
				}
			}
			await interaction.reply({ content: 'AFK message set! I will reply with your message if you are tagged.', ephemeral: true });
		} catch (error) {
			console.error(error);
		}
	},
});