import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'requests',
	description: 'information about submiting a bug report or requesting a feature to be added to Overlay Expert',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	run: async ({ interaction }) => {
		const { guild, options } = interaction;

		const Target = options.getUser('target');

		try {
			const infoEmbed = new EmbedBuilder()
				.setColor(Colors.Purple)
				.addFields([
					{
						name: 'Current List of Bugs&Features',
						value: 'For a list of currently tracked bugs and features requests, see <https://github.com/overlay-expert/help-desk/issues>.'
					},
					{
						name: 'Report Bugs/Request New Features!',
						value: 'To report a new bug or request a new feature not listed above, see <https://github.com/overlay-expert/help-desk/issues/1#user-content-report>.'
					}
				])
				.setFooter({ text: `${guild?.name}` });

			if (Target) {
				return await interaction.reply({ content: `${Target}`, embeds: [infoEmbed] });
			}
			else {
				return await interaction.reply({ embeds: [infoEmbed] });
			}
		} catch (error) {
			console.error(error);
		}
	}
});