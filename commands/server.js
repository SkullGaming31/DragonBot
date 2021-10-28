const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, CommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Replies with information about the server'),
	/**
	* 
	* @param {CommandInteraction} interaction 
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const serverEmbed = new MessageEmbed()
			.setTitle(`${guildName}`)
			.setDescription('')
			.setFooter(`${guildName}`)
			.addField('Server Name: ', `**${guildName}**`, true)
			.addField('Total Members: ', `**${interaction.guild.memberCount}**`, true);
		await interaction.reply({ content: ' ', embeds: [serverEmbed] });
	},
};