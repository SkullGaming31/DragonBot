const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, CommandInteraction } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('gets user information'),
	/**
	* 
	* @param {CommandInteraction} interaction 
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const userEmbed = new MessageEmbed()
			.setTitle(`${interaction.user.tag}`)
			.setDescription('')
			.setColor('DARK_RED')
			.addField('**Your id:** ', `**${interaction.user.id}**`, true)
			.addField('**Your Tag:** ', `**${interaction.user.tag}**`, true)
			.addField('**Your Roles:** ', '**WIP**', true)
			.setFooter(`${guildName}`);
		await interaction.reply({ content: ' ', embeds: [userEmbed] });
	},
};