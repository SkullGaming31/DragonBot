import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
import DB from '../../Structures/Schemas/WarnDB';

export default new Command({
	name: 'warn',
	description: 'Warns a user',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'Select a target',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'reason',
			description: 'Provide a reason for giving this warning',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options, guild } = interaction;

		const Target = options.getUser('target');
		const Reason = options.getString('reason') || 'No Reason Provided';

		//Check to see if the user is already in the warnings database
		const existingWarning = await DB.findOne({ GuildID: guild.id, UserID: Target?.id });

		const existingWarningEmbed = new EmbedBuilder()
			.setTitle('WARNING')
			.setColor('Red')
			.setAuthor({ name: `${Target?.tag}`, iconURL: `${Target?.displayAvatarURL({ size: 512 })}` })
			.setDescription(`${Target?.username} has been warned, they now have ${existingWarning?.Warnings} warnings, Reason: ${Reason}`)
			.setTimestamp();
		
		// if the user already has a warning, increment there warning count in the Database.
		if (existingWarning) {
			existingWarning.Warnings += 1;
			await existingWarning.save();
			interaction.reply({ embeds: [existingWarningEmbed] });
		} else {
			// if the user does not have a warning create a new warning entry in the database
			const newWarning = new DB({
				GuildID: guild.id,
				UserID: Target?.id,
				Warnings: 1,
				Reason: Reason,
			});
			await newWarning.save();
			interaction.reply({ content: `${Target?.tag} has been warned, they now have there first warning for Reason: ${Reason}` });
		}
	}
});