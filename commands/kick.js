const { SlashCommandBuilder } = require('@discordjs/builders');
const { Client, CommandInteraction, GuildMember } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('kick a member from the server'),
	/**
	* 
    * @param {Client} client
	* @param {CommandInteraction} interaction
    * @param {String[]} args
    * @returns
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const target = interaction.options.getMember('target');
		const reason = interaction.options.getString('reason') || 'No Reason provided';

		if (target.roles.highest.position >= interaction.member.roles.highest.position) {
			return interaction.followUp({ content: 'you cant take action on this user as there role is highter then yours' });
		}
		await target.send({ content: `you have been kicked from ${guildName}, reason: ${reason}` });
		target.kick({ reason: reason });

		interaction.followUp({ content: `kicked ${interaction.user.tag} Successfully, Reason: ${reason}` });
	},
};