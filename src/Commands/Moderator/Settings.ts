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
			// const Suggestion = options.getChannel('suggestions');
			const Welcome = options.getBoolean('welcome');
			const Welcomechan = options.getChannel('welcomechan') || null;
			const NowLive = options.getChannel('live') || null;

			const Administrator = options.getRole('admin');
			const Moderator = options.getRole('moderator');

			settings.findOne({ GuildID: guild.id }, async (err: any, data: any) => {
				if (err) throw err;
				if (!data) {
					data = new settings({
						GuildID: guild.id,
						Welcome: Welcome,
						WelcomeChannel: Welcomechan?.id,
						PromotionChannel: NowLive?.id,
						AdministratorRole: Administrator?.id,
						ModeratorRole: Moderator?.id
					});
				} else {
					await settings.findOneAndUpdate(
						{ GuildID: guild.id },
						{
							Welcome: Welcome,
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