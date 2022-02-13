const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, CommandInteraction } = require('discord.js');

module.exports = {
	name: 'requests',
	data: new SlashCommandBuilder()
		.setName('requests')
		.setDescription('Request new features for Overlay Expert')
		.addUserOption(option => option.setName('target')
			.setDescription('The user you want to mention')
			.setRequired(false)),
	/**
	* 
	* @param {CommandInteraction} interaction 
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const target = interaction.options.getUser('target');

		const requestEmbed = new MessageEmbed()
			.setDescription('For a list of currently tracked bugs and features requests, see <https://github.com/overlay-expert/help-desk/issues>. ')
			.setColor('PURPLE')
			.setFooter({ text: `${guildName}` });

		const bugsFeatures = new MessageEmbed()
			.setDescription('To report a new bug or request a new feature not listed above, see <https://github.com/overlay-expert/help-desk/issues/1#user-content-report>.')
			.setColor('PURPLE')
			.setFooter({ text: `${guildName}` });

		if (target) {// only sending the bugsFeature embed
			await interaction.deferReply();
			requestEmbed.setTitle(`${target.tag}`);
			interaction.editReply({ content: `${target}`, embeds: [requestEmbed] });
			bugsFeatures.setTitle(`${target.tag}`);
			interaction.followUp({ content: `${target}`, embeds: [bugsFeatures] });
		}
		else {
			await interaction.deferReply();
			requestEmbed.setTitle('Current List of Bugs&Features');
			interaction.editReply({ embeds: [requestEmbed] });
			bugsFeatures.setTitle('Report Bugs/Request New Features!');
			interaction.followUp({ embeds: [bugsFeatures] });
		}
	},
};