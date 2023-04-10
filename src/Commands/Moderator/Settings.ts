import { ApplicationCommandType, ApplicationCommandOptionType, ChannelType, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
import settings from '../../Structures/Schemas/settingsDB';

export default new Command({
	name: 'settings',
	description: 'Guild settings for some channels',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	defaultMemberPermissions: ['ManageChannels'],
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
		},
		{
			name: 'sugestchan',
			description: 'Channel your Suggestions are sent too',
			type: ApplicationCommandOptionType.Channel,
			required: false,
			channelTypes: [ChannelType.GuildText]
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { guild, options } = interaction;

		try {
			const SuggestionChan = options.getChannel('sugestchan') || null;
			const Welcome = options.getBoolean('welcome');
			const Welcomechan = options.getChannel('welcomechan') || null;
			const NowLive = options.getChannel('live') || null;

			const Administrator = options.getRole('admin');
			const Moderator = options.getRole('moderator');

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			settings.findOne({ GuildID: guild.id }, async (err: any, data: any) => {
				if (err) throw err;
				if (!data) {
					data = new settings({
						GuildID: guild.id,
						Welcome: Welcome,
						WelcomeChannel: Welcomechan?.id,
						PromotionChannel: NowLive?.id,
						AdministratorRole: Administrator?.id,
						ModeratorRole: Moderator?.id,
						SuggestChan: SuggestionChan?.id
					});
				} else {
					await settings.findOneAndUpdate(
						{ GuildID: guild.id },
						{
							Welcome: Welcome,
							WelcomeChannel: Welcomechan?.id,
							PromotionChannel: NowLive?.id,
							AdministratorRole: Administrator?.id,
							ModeratorRole: Moderator?.id,
							SuggestChan: SuggestionChan?.id
						},
						{
							new: true,
							upsert: true
						}
					);
				}
				data.save();
			});
			const embed = new EmbedBuilder()
				.setTitle('Database')
				.setDescription('Added and/or Updated the database')
				.addFields(
					{
						name: 'Welcome Message Enabled',
						value: `${Welcome}`,
						inline: true
					},
					{
						name: 'Welcome Channel',
						value: `${Welcomechan?.id}`,
						inline: true
					},
					{
						name: 'Promotion Channel',
						value: `${NowLive?.id}`,
						inline: true
					},
					{
						name: 'Admin Role ID',
						value: `${Administrator?.id}`,
						inline: false
					},
					{
						name: 'Moderator Role ID',
						value: `${Moderator?.id}`,
						inline: true
					},
					{
						name: 'Suggestion Channel ID',
						value: `${SuggestionChan?.id}`,
						inline: true
					}
				)
				.setTimestamp();
			interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error(error);
		}
	}
});