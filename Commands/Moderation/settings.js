const { ChatInputCommandInteraction, ApplicationCommandOptionType, ChannelType } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'settings',
	description: 'Guild settings for some channels',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
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
			name: 'welcomechan',
			description: 'Welcome Channel',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText]
		},
		{
			name: 'live',
			description: 'The Now Live channel',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText]
		}
	],
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction
	 */
	async execute(interaction) {
		const { guild, options } = interaction;

		try {
			const Logging = options.getChannel('logging');
			// const Suggestion = options.getChannel('suggestions');
			const Welcome = options.getBoolean('welcome');
			const Welcomechan = options.getChannel('welcomechan');
			const NowLive = options.getChannel('live');

			const Administrator = options.getRole('admin');
			const Moderator = options.getRole('moderator');


			const Data = await DB.findOneAndUpdate(
				{ GuildID: guild.id },
				{
					LoggingChannel: Logging.id,
					Welcome: Welcome,
					WelcomeChannel: Welcomechan.id,
					PromotionChannel: NowLive.id,
					AdministratorRole: Administrator.id,
					ModeratorRole: Moderator.id
				},
				{
					new: true,
					upsert: true
				}
			);

			interaction.reply({ content: 'Added and/or Updated the database', ephemeral: true });
		} catch (error) {
			console.error(error);
		}
	},
};