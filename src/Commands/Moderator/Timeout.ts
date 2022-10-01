import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, Colors } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
import ms from 'ms';

export default new Command({
	name: 'timeout',
	description: 'Timeout a user from sending messages or joining a voice channel',
	UserPerms: ['ModerateMembers'],
	BotPerms: ['ModerateMembers'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'the user you want to timeout',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'length',
			description: 'how long do you want to timeout the user',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'reason',
			description: 'reason for timing out the user',
			type: ApplicationCommandOptionType.String
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options } = interaction;

		const Target = options.getMember('target');
		const Length = options.getString('length');
		const reason = options.getString('reason') || 'No Reason Provided';

		if (Length === null) return interaction.reply({ content: 'You must provide a length of time to time someone out.(1s,1m,1h,1d)' });

		const timeInMs = ms(Length) / 1000;

		try {
			// await interaction.deferReply();
			if (!timeInMs) return interaction.reply({ content: 'Please specify a valid time(1s,1m,1h,1d)' });

			const timedoutEmbed = new EmbedBuilder()
				.setTitle(`${Target?.displayName}`)
				.addFields({ name: 'Timed Out for: ', value: `\`${timeInMs}\``, inline: true })
				.addFields({ name: 'Reason: ', value: `\`${reason}\``, inline: true })
				.setColor(Colors.Red);
			interaction.reply({ embeds: [timedoutEmbed], ephemeral: true });
			Target?.timeout(timeInMs, reason);
		} catch (error) {
			console.error(error);
			return;
		}
	}
});