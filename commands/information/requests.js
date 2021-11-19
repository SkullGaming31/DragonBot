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
			.setDescription('For a list of currently tracked bugs and features requests, see <https://github.com/overlay-expert/help-desk/issues>. To report a new bug or request a new feature not listed above, see <https://github.com/overlay-expert/help-desk/issues/1#user-content-report>.')
			.setColor('PURPLE')
			.setFooter(`${guildName}`);

		if (target) {
			requestEmbed.setTitle(`${target.tag}`);
			await interaction.reply({ content: `${target}`, embeds: [requestEmbed] });
		}
		else {
			requestEmbed.setTitle(`${guildName}`);
			await interaction.reply({ embeds: [requestEmbed] });
		}
	},
};