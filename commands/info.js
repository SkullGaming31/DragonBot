const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Returns Info Based on input!')
		.addSubcommand(subCommand => 
			subCommand.setName('user')
				.setDescription('Get Information of a user mentioned')
				.addUserOption(option => option.setName('target').setDescription('the User Mentioned')))
		.addSubcommand(subCommand => 
			subCommand.setName('server')
				.setDescription('Get info about the server')),
	/**
	* 
	* @param {CommandInteraction} interaction 
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		if (interaction.options.getSubcommand() === 'user') {
			const user = interaction.options.getUser('target');
			if (user) {
				const targetEmbed = new MessageEmbed()
					.setTitle(`${user.tag}`)
					.setDescription('')
					.setColor('DARK_RED')
					.addField('**Your Id:** ', `**${user.id}**`, true)
					.addField('**Your Username:** ', `**${user.username}**`, true)
					.addField('**Your Tag:** ', `**${user.tag}**`, true)
					.addField('**Warnings:** ', '**0**', true)
					.addField('**Your Roles:** ', '**WIP**', true)
					.setFooter(`${guildName}`);
				await interaction.reply({ embeds: [targetEmbed] });
			} else {
				const userEmbed = new MessageEmbed()
					.setTitle(`${interaction.user.tag}`)
					.setDescription('')
					.setColor('DARK_RED')
					.addField('**Your id:** ', `**${interaction.user.id}**`, true)
					.addField('**Your Username:** ', `**${interaction.user.username}**`, true)
					.addField('**Your Tag:** ', `**${interaction.user.tag}**`, true)
					.addField('**Warnings:** ', '**0**', true)
					.addField('**Your Roles:** ', '**WIP**', true)
					.setFooter(`${guildName}`);
				await interaction.reply({ embeds: [userEmbed] });
			}
		}
		else if (interaction.options.getSubcommand() === 'server') {
			const serverEmbed = new MessageEmbed()
				.setTitle(`${guildName}`)
				.setDescription('')
				.setFooter(`${guildName}`)
				.addField('Server Name: ', `**${guildName}**`, true)
				.addField('Total Members: ', `**${interaction.guild.memberCount}**`, true);
			await interaction.reply({ embeds: [serverEmbed] });
		}
	},
};