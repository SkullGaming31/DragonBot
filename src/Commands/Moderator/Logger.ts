import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, channelMention } from 'discord.js';
import DB from '../../Database/Schemas/LogsChannelDB'; // DB
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'logger',
	description: 'Enable and set the Logs Channel in your guild',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'enablelogs',
			description: 'Enable or Disable the Logger Channel',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'logger',
			description: 'Select your Logs Channel',
			type: ApplicationCommandOptionType.Channel,
			channelTypes: [ChannelType.GuildText],
			required: false
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;
		if (!interaction.isChatInputCommand()) return;
		const { guild, options } = interaction;

		try {
			const EnableLogs = options.getBoolean('enablelogs') || undefined;
			const Logger = options.getChannel('logger') || null;

			// Find or create a document using async/await
			let data;
			try {
				data = await DB.findOne({ GuildID: guild.id });
			} catch (err) {
				console.error('Error fetching data:', err);
				return interaction.reply({ content: 'An error occurred.', ephemeral: true });
			}

			if (Logger?.id === undefined) return;

			if (!data) {
				data = new DB({
					Guild: guild.id,
					enableLogs: EnableLogs,
					Channel: Logger?.id,
				});
			} else {
				data.enableLogs = EnableLogs;
				data.Channel = Logger?.id;
			}

			const embed = new EmbedBuilder()
				.setTitle('Logger Channel')
				.setDescription(`Logs Enabled: ${data.enableLogs}\nChannelLogger: ${channelMention(Logger?.id)}`)
				.setTimestamp();

			await data.save();
			await interaction.reply({ content: 'Added and/or Updated the database', embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'An error occurred.', ephemeral: true });
			return;
		}
	}
});