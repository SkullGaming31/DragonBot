import { ApplicationCommandType, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
import settings from '../../Structures/Schemas/settingsDB';

export default new Command({
	name: 'settings',
	description: 'Guild settings for some channels',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'logging',
			description: 'Select the logging channel',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText]
		},
		{
			name: 'admin',
			description: 'Select your administrator role',
			type: ApplicationCommandOptionType.Role,
			required: true
		},
		{
			name: 'moderator',
			description: 'Select your moderator role',
			type: ApplicationCommandOptionType.Role,
			required: true
		},
		{
			name: 'welcome',
			description: 'Enable or Disable the Welcome Message when someone joins the server',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'memberrole',
			description: 'Enable or Disable the Rember Role assigning when someone joins the guild',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'membernick',
			description: 'Enable or Disable the nickname change logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'channeltopic',
			description: 'Enable or Disable the channel topic update logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'memberboost',
			description: 'Enable or Disable the Member Boost Logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'rolestatus',
			description: 'Enable or Disable the Role Status Logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'channelstatus',
			description: 'Enable or Disable the Channel Status Logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'emojistatus',
			description: 'Enable or Disable the Emoji Status Logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'memberban',
			description: 'Enable or Disable the Member Ban Logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'messageupdates',
			description: 'Enable or Disable the Message Update/delete Logs',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'welcomechan',
			description: 'The channel were your welcome messages will be posted when they join the server',
			type: ApplicationCommandOptionType.Channel,
			required: false,
			channelTypes: [ChannelType.GuildText]
		},
		{
			name: 'live',
			description: 'The channel were your members will post there going live links',
			type: ApplicationCommandOptionType.Channel,
			required: false,
			channelTypes: [ChannelType.GuildText]
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { guild, options } = interaction;

		try {
			const Logging = options.getChannel('logging');
			// const Suggestion = options.getChannel('suggestions');
			const Welcome = options.getBoolean('welcome');
			const Welcomechan = options.getChannel('welcomechan');
			const NowLive = options.getChannel('live');

			const MemberRole = options.getBoolean('memberrole');
			const MemberNickname = options.getBoolean('membernick');
			const ChannelTopic = options.getBoolean('channeltopic');
			const MemberBoost = options.getBoolean('memberboost');
			const RoleStatus = options.getBoolean('memberstatus');
			const ChannelStatus = options.getBoolean('channelstatus');
			const EmojiStatus = options.getBoolean('emojistatus');
			const MemberBan = options.getBoolean('memberban');
			const MessageUpdates = options.getBoolean('messageupdates');

			const Administrator = options.getRole('admin');
			const Moderator = options.getRole('moderator');

			settings.findOne({ GuildID: guild.id }, async (err: any, data: any) => {
				if (err) throw err;
				if (!data) {
					data = new settings({
						GuildID: guild.id,
						LoggingChannel: Logging?.id,
						Welcome: Welcome,
						MemberRole: MemberRole,
						MemberNickname: MemberNickname,
						ChannelTopic: ChannelTopic,
						MemberBoost: MemberBoost,
						RoleStatus: RoleStatus,
						ChannelStatus: ChannelStatus,
						EmojiStatus: EmojiStatus,
						MemberBan: MemberBan,
						MessageUpdates: MessageUpdates,
						WelcomeChannel: Welcomechan?.id,
						PromotionChannel: NowLive?.id,
						AdministratorRole: Administrator?.id,
						ModeratorRole: Moderator?.id
					});
				} else {
					await settings.findOneAndUpdate(
						{ GuildID: guild.id },
						{
							LoggingChannel: Logging?.id,
							Welcome: Welcome,
							MemberRole: MemberRole,
							MemberNickname: MemberNickname,
							ChannelTopic: ChannelTopic,
							MemberBoost: MemberBoost,
							RoleStatus: RoleStatus,
							ChannelStatus: ChannelStatus,
							EmojiStatus: EmojiStatus,
							MemberBan: MemberBan,
							MessageUpdates: MessageUpdates,
							WelcomeChannel: Welcomechan?.id,
							PromotionChannel: NowLive?.id,
							AdministratorRole: Administrator?.id,
							ModeratorRole: Moderator?.id
						},
						{
							new: true,
							upsert: true
						}
					);
				}
				data.save();
			});
			interaction.reply({ content: 'Added and/or Updated the database', ephemeral: true });
		} catch (error) {
			console.error(error);
			return;
		}
	}
});