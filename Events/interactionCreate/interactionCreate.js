const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { DISCORD_LOGS_CHANNEL_ID } = require('../../Structures/config');
module.exports = {
	name: 'interactionCreate',

	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 * @param {Client} client 
	 * @returns 
	 */

	async execute(interaction, client) {
		const { guild } = interaction;
		
		
		
		if (interaction.isCommand() || interaction.isContextMenu()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) return interaction.reply({ embeds: [
				new MessageEmbed()
					.setColor('RED')
					.setDescription('⛔ an error occured while running this command')
					.setThumbnail(`${guild.iconURL({dynamic: true})}`)
			]}) && client.commands.delete(interaction.commandName);
			
			command.execute(interaction, client);
		}
		// const targetChannel = guild.channels.cache.find(channel => channel.id === DISCORD_LOGS_CHANNEL_ID);// Logs Channel
		// const logsEmbed = new MessageEmbed()
		// 	.setTitle('Command Usage Detection')
		// 	.setDescription(`${user.username} used /${interaction.commandName} in ${channel.name}`) // user commandUsed inwhatchannel
		// 	.setColor('GREEN')
		// 	.setTimestamp(Date.now());
		// 	// await targetChannel.send({ embeds: [logsEmbed] });
		// await guild.channels.cache.get(DISCORD_LOGS_CHANNEL_ID).send({ embeds: [logsEmbed] });
	},
};