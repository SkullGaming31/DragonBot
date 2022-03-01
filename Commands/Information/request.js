const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'requests',
	description: 'information about submiting a bug report or requesting a feature to be added to Overlay Expert',
	permission: 'SEND_MESSAGES',
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: 'USER',
			required: false
		}
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, options } = interaction;

		const Target = options.getUser('target');

		try {
			const requestEmbed = new MessageEmbed()
				.setDescription('For a list of currently tracked bugs and features requests, see <https://github.com/overlay-expert/help-desk/issues>. ')
				.setColor('PURPLE')
				.setFooter({ text: `${guild.name}` });

			const bugsFeatures = new MessageEmbed()
				.setDescription('To report a new bug or request a new feature not listed above, see <https://github.com/overlay-expert/help-desk/issues/1#user-content-report>.')
				.setColor('PURPLE')
				.setFooter({ text: `${guild.name}` });

			if (Target) {// only sending the bugsFeature embed
				await interaction.deferReply();
				requestEmbed.setTitle(`${Target.tag}`);
				interaction.editReply({ content: `${Target}`, embeds: [bugsFeatures, requestEmbed] });
			}
			else {
				await interaction.deferReply();
				requestEmbed.setTitle('Current List of Bugs&Features');
				bugsFeatures.setTitle('Report Bugs/Request New Features!');
				interaction.editReply({ embeds: [bugsFeatures, requestEmbed] });
			}
		} catch (error) {
			console.error(error);
		}
	}
};