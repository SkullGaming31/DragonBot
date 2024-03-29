import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';
import DB from '../../Database/Schemas/LogsChannelDB'; // DB
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'logger',
	description: 'Enable and set the Logs Channel in your guild',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
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
			const EnableLogs = options.getBoolean('enablelogs');
			const Logger = options.getChannel('logger') || null;

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			DB.findOne({ GuildID: guild.id }, async (err: any, data: any) => {
				if (err) throw err;
				if (!data) {
					data = new DB({
						Guild: guild.id,
						enableLogs: EnableLogs,
						Channel: Logger?.id,
					});
				} else {
					await DB.findOneAndUpdate(
						{ Guild: guild.id },
						{
							enableLogs: EnableLogs,
							Channel: Logger?.id,
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