const { Client, CommandInteraction, MessageEmbed } = require('discord.js');
const { DISCORD_LOGS_CHANNEL_ID } = require('../../Structures/config');
const settingsDB = require('../../Structures/Schemas/settingsDB');
module.exports = {
	name: 'interactionCreate',

	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 * @param {Client} client 
	 * @returns 
	 */

	async execute(interaction, client) {
		const { guild, guildId, user, channel } = interaction;
		const Data = await settingsDB.findOne({ GuildID: guildId });
		if (!Data) return;
		
		
		if (interaction.isCommand() || interaction.isContextMenu()) {
			const command = client.commands.get(interaction.commandName);
			if (!command) return interaction.reply({ embeds: [
				new MessageEmbed()
					.setColor('RED')
					.setDescription('⛔ an error occured while running this command')
					.setThumbnail(`${guild.iconURL({dynamic: true})}`)
			]}) && client.commands.delete(interaction.commandName);
			
			if (!interaction.member.permissions.has(command.permission)) return interaction.reply({ content: `You do not have the required permission for this command: \`/${interaction.commandName}\`.`, ephemeral: true });
			command.execute(interaction, client);
		}
		// const targetChannel = guild.channels.cache.find(channel => channel.id === Data.LoggingChannel);// Logs Channel
		const logsEmbed = new MessageEmbed()
			.setTitle('Command Usage Detection')
			.setDescription(`${user.username} used /${interaction.commandName} in ${channel.name}`) // user commandUsed inwhatchannel
			.setColor('GREEN')
			// .setFooter({ text: `from ${guild.name}` })
			.setTimestamp();
		// await targetChannel.send({ embeds: [logsEmbed] });
		if (Data) {
			guild.channels.cache.get(Data.LoggingChannel).send({ embeds: [logsEmbed] });
		} else {
			return;
		}
	},
};