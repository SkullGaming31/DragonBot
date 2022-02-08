const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const ms = require('ms');

module.exports = {
	name: 'mute',
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('mute a member')
		.addUserOption(option => option.setName('target')
			.setDescription('the user you want to mute')
			.setRequired(true))
		.addStringOption(option => option.setName('reason')
			.setDescription('Provide a reason')
			.setRequired(false))
		.addStringOption(option => option.setName('custom-time').setDescription('provide a custom time(1s,1m,1h,1d)').setRequired(false)),
	/**
	 * 
	 * @param {Client} client 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(client, interaction) {
		// NOT CURRENTLY WORKING!!!
		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason') || '#NoReason';
		const time = interaction.options.getString('custom-time') || '1h';
		const muteRole = process.env.MUTE_ROLE_ID;

		if (!interaction.guild.roles.cache.get(muteRole)) return interaction.followUp({ embeds: [new MessageEmbed().setColor('DARK_RED').setDescription('⛔ the mute role does not exist')] });

		await target.roles.add(muteRole);
		setTimeout(async () => {
			if (!target.roles.cache.has(muteRole)) return;
			await target.roles.remove(muteRole);
		}, (ms(time)));
		interaction.followUp({ embeds: [new MessageEmbed().setColor('GREEN').setDescription(`✅ ${target} has been muted! for ${time} reason: ${reason} | ||${target.id}||`)] });
	},
};