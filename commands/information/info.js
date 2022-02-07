const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'info',
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
					.addField('Your Id: ', `${user.id}`, true)
					.addField('Your Username: ', `${user.username}`, true)
					.addField('Your Tag: ', `${user.tag}`, true)
					.addField('Warnings: ', '0', true)
					.setThumbnail(user.displayAvatarURL())
					.setFooter(`${guildName}`);
				await interaction.deferReply();
				interaction.editReply({ embeds: [targetEmbed] });
			} else {
				const userEmbed = new MessageEmbed()
					.setTitle(`${interaction.user.tag}`)
					.setDescription('')
					.setColor('DARK_RED')
					.addField('_Your id:_ ', `${interaction.user.id}`, true)
					.addField('_Your Username:_ ', `${interaction.user.username}`, true)
					.addField('_Your Tag:_ ', `${interaction.user.tag}`, true)
					.addField('_Account Created:_ ', `${interaction.user.createdAt}`, true)
					.addField('_Warnings:_ ', '0', true)
					.addField('_Joined:_ ', `${interaction.guild.joinedAt}`, true)
					.setThumbnail(interaction.user.displayAvatarURL())
					.setFooter(`${guildName}`);
				await interaction.deferReply();
				interaction.editReply({ embeds: [userEmbed] });
			}
		}
		else if (interaction.options.getSubcommand() === 'server') {
			const serverEmbed = new MessageEmbed()
				.setTitle(`${guildName}`)
				.setDescription('')
				.setFooter(`${guildName}`)
				.addField('Server Name: ', `${guildName}`, true)
				.addField('Total Members: ', `${interaction.guild.memberCount}`, true);
			await interaction.deferReply();
			interaction.editReply({ embeds: [serverEmbed] });
		}
	},
};