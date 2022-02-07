const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: 'unmute',
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('unmute a member')
		.addUserOption(option => option.setName('target')
			.setDescription('the user you want to unmute')
			.setRequired(true)),
	/**
 * 
 * @param {Client} client 
 * @param {CommandInteraction} interaction 
 */
	async execute(client, interaction) {
		const target = interaction.options.getMember('target');
		const muteRole = process.env.MUTE_ROLE_ID;

		if (!target.roles.cache.has(muteRole)) return interaction.followUp({ embeds: [new MessageEmbed().setColor('RED').setDescription('⛔ the member is not muted')] });

		target.roles.remove(muteRole);
		interaction.followUp({ embeds: [new MessageEmbed().setColor('GREEN').setDescription(`✅ ${target} has been unmuted`)] });
	},
};