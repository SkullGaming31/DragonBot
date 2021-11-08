const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, GuildMember, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('kick a member from the server')
		.addUserOption(option => option.setName('target')
			.setDescription('the user you want to mention')
			.setRequired(true)),
	/**
	* 
  * @param {Client} client
	* @param {CommandInteraction} interaction
  * @param {String[]} args
  * @returns
	*/
	async execute(interaction) {
		// DOES NOT WORK YET
		const guildName = interaction.guild.name;
		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason') || 'No Reason provided';

		if (target.roles.highest.position >= interaction.user.roles.highest.position) {
			return interaction.followUp({ content: 'you cant take action on this user as there role is highter then yours' });
		}
		const removedEmbed = new MessageEmbed()
			.setTitle(`${guildName}`)
			.setDescription('')
			.addField('Kicked from: ', `${guildName}`, true)
			.addField('Reason: ', `${reason}`, true);
		await target.send({ embeds: [removedEmbed] });
		target.kick({ reason: reason });

		interaction.followUp({ content: `kicked ${interaction.user.tag} Successfully, Reason: ${reason}` });
	},
};