const { ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, Colors, PermissionFlagsBits, PermissionsBitField } = require('discord.js');

module.exports = {
	name: 'requests',
	description: 'information about submiting a bug report or requesting a feature to be added to Overlay Expert',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, options, member } = interaction;

		const Target = options.getUser('target');
		const targetUser = guild.channels.cache.get(Target.id);

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
				.setFooter({ text: `${guild.name}` });

			if (Target && member.permissions.has([PermissionFlagsBits.ManageMessages, PermissionFlagsBits.Administrator])) {
				return await interaction.reply({ content: `${targetUser}`, embeds: [infoEmbed] });
			}
			else {
				return await interaction.reply({ embeds: [infoEmbed] });
			}
		} catch (error) {
			console.error(error);
		}
	}
};