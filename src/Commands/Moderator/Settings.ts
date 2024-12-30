import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, channelMention, roleMention } from 'discord.js';
import settings from '../../Database/Schemas/settingsDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'settings',
	description: 'Discord Server Bot Settings',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	defaultMemberPermissions: ['ManageChannels'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
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
			name: 'ruleschan',
			description: 'The channel for your rules',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText]
		},
		{
			name: 'welcome',
			description: 'Enable or Disable the Welcome Message when someone joins the server',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'modchannel',
			description: 'Channel where all important bot messages will be displayed',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText]
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
			description: 'The channel were your members will post when going live',
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
		},
		{
			name: 'econchan',
			description: 'Channel your economy games can be played in',
			type: ApplicationCommandOptionType.Channel,
			required: false,
			channelTypes: [ChannelType.GuildText]
		},
		{
			name: 'punishmentchan',
			description: 'Channel your Punishment Logs are sent too',
			type: ApplicationCommandOptionType.Channel,
			required: false,
			channelTypes: [ChannelType.GuildText]
		},
		{
			name: 'memberrole',
			description: 'Role to assign when someone joins the discord server',
			type: ApplicationCommandOptionType.Role,
			required: false,
		}
	],
	run: async ({ interaction }) => {
		try {
			if (!interaction.inCachedGuild()) return;
			const { guild, options } = interaction;
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
				console.log('Retrieved options:', options);
			}
			const SuggestionChan = options.getChannel('sugestchan') || null;
			const PunishmentChan = options.getChannel('punishmentchan') || null;
			const RulesChannel = options.getChannel('ruleschan');
			const Welcome = options.getBoolean('welcome');
			const Welcomechan = options.getChannel('welcomechan') || null;
			const NowLive = options.getChannel('live') || null;
			const ModerationChannel = options.getChannel('modchannel') || null;
			const EconChannel = options.getChannel('econchan') || null;

			const Administrator = options.getRole('admin') ?? null;
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
				console.log('Administrator role ID:', Administrator);
			}
			const Moderator = options.getRole('moderator') ?? null;
			const MemberRole = options.getRole('memberrole') ?? null;

			// Find or create a document using async/await
			let data;
			try {
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
					console.log('Fetching settings data');
				}
				data = await settings.findOne({ GuildID: guild.id });
			} catch (err) {
				console.error('Error fetching data:', err);
				return interaction.reply({ content: 'An error occurred.', ephemeral: true });
			}

			if (!data) {
				data = new settings({
					GuildID: guild.id,
					rulesChannel: RulesChannel?.id,
					Welcome: Welcome,
					WelcomeChannel: Welcomechan?.id,
					PromotionChannel: NowLive?.id,
					PunishmentChan: PunishmentChan?.id,
					AdministratorRole: Administrator?.id,
					ModeratorRole: Moderator?.id,
					MemberRole: MemberRole?.id,
					SuggestChan: SuggestionChan?.id,
					EconChan: EconChannel?.id,
					ModerationChannel: ModerationChannel?.id
				});
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
					console.log('Created new document in database');
				}
				await data.save();
			} else {
				await settings.findOneAndUpdate({
					GuildID: guild.id
				},
					{
						rulesChannel: RulesChannel?.id,
						Welcome: Welcome,
						WelcomeChannel: Welcomechan?.id,
						PromotionChannel: NowLive?.id,
						PunishmentChan: PunishmentChan?.id,
						AdministratorRole: Administrator?.id,
						ModeratorRole: Moderator?.id,
						MemberRole: MemberRole?.id,
						SuggestChan: SuggestionChan?.id,
						EconChan: EconChannel?.id,
						ModerationChannel: ModerationChannel?.id
					}, {
					new: true,
					upsert: true
				});
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
					console.log('updating document in database');
				}
			}
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
						value: Welcomechan ? channelMention(Welcomechan?.id) : 'None',
						inline: true
					},
					{
						name: 'Promotion Channel',
						value: NowLive ? channelMention(NowLive.id) : 'None',
						inline: true
					},
					{
						name: 'Admin Role',
						value: Administrator ? roleMention(Administrator.id) : 'None',
						inline: false
					},
					{
						name: 'Moderator Role',
						value: Moderator ? roleMention(Moderator.id) : 'None',
						inline: true
					},
					{
						name: 'Member Role',
						value: MemberRole ? roleMention(MemberRole.id) : 'NONE',
						inline: false
					},
					{
						name: 'Suggestion Channel:',
						value: SuggestionChan ? channelMention(SuggestionChan?.id) : 'None',
						inline: true
					},
					{
						name: 'Punishment Channel:',
						value: PunishmentChan ? channelMention(PunishmentChan?.id) : 'None',
						inline: true
					},
					{
						name: 'Rules Channel',
						value: RulesChannel ? channelMention(RulesChannel?.id) : 'None',
						inline: false
					},
					{
						name: 'Econ Channel',
						value: EconChannel ? channelMention(EconChannel.id) : 'None',
						inline: true
					}
				)
				.setTimestamp();
			await interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error(error);
		}
	}
});