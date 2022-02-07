const { Client, CommandInteraction, MessageEmbed, Permissions } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const ms = require('ms');

module.exports = {
	name: 'timeout',
	Permissions: [Permissions.FLAGS.MODERATE_MEMBERS],
	data: new SlashCommandBuilder()
		.setName('timeout')
		.setDescription('Stop someone for speaking for X length')
		.addUserOption(option => option.setName('user')
			.setDescription('the user you want to timeout')
			.setRequired(true))
		.addStringOption(option => option.setName('length')
			.setDescription('how long do you want to timeout the user')
			.setRequired(true))
		.addStringOption(option => option.setName('reason')
			.setDescription('reason for timing out the user')
			.setRequired(false)),

	/**
 * 
 * @param {Client} client 
 * @param {CommandInteraction} interaction 
 */
	async execute(interaction) {
		const target = interaction.options.getMember('user');
		const length = interaction.options.getString('length');
		let reason = interaction.options.getString('reason');
		// const member = interaction.guild.members.cache.get(target.id);
		const timeInMs = ms(length) / 1000;

		// checking roles so mods cant timeout admin needs testing!!
		
		await interaction.deferReply();
		if (target.roles.highest.position >= interaction.member.roles.highest.position) {
			return interaction.followUp({ content: 'you cant take action on this user as there role is highter then yours' });
		}

		if (!Permissions) return interaction.followUp({ content: 'You do not have permission to use this command' });
		if (!timeInMs) return interaction.followUp({ content: 'Please specify a valid time' });
		if (!reason) reason = 'No Reason Provided';

		const timedoutEmbed = new MessageEmbed()
			.setTitle(`${target.displayName}`)
			.setDescription('')
			.addField('Timed Out for: ', `${timeInMs}`, true)
			.addField('Reason: ', `${reason}`, true)
			.setColor('RED');
		interaction.editReply({ embeds: [timedoutEmbed] });
		target.timeout(timeInMs, reason);
	},
};