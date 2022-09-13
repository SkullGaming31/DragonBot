/* eslint-disable indent */
const { Client, Message, EmbedBuilder, Colors, ChannelType } = require('discord.js');

module.exports = {
	name: 'messageDelete',

	/**
	 * 
	 * @param {Message} message 
	 * @param {Client} client
	 */
	async execute(message, client) {
		const { guild, channel } = message;
		const { channels } = client;

		const log = new EmbedBuilder()
			.setTitle('MESSAGE DELETED')
			.setColor(Colors.Green)
			.setAuthor({ name: `${message.author?.tag || 'No User Detected'}` })
			// .setDescription(`🚨 **Deleted Message:**\n \`${message.content ? message.content : 'None'}\``.slice(0, 4096))
			.addFields({ name: '🚨 | Deleted Message: ', value: `\`${message.content ? message.content : 'None'}\``.slice(0, 4096) })
			.addFields({ name: 'Channel', value: `<#${channel.id}>` })
			.setURL(`${message.url}`);

		if (message.attachments.size >= 1) {
			log.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
		}
		switch (guild.id) {
			case '183961840928292865':// Overlay Expert
				const overlaylogsChannel = channels.cache.get('765920602287636481');
				try {
					if (channel.type === ChannelType.GuildText && channel.type !== ChannelType.GuildPublicThread) {
						await overlaylogsChannel.send({ embeds: [log] });
					}
				} catch (error) {
					console.error(error);
					return;
				}
				break;
			case '959693430227894292':// Overlay Expert Test Server
				const logsChannel = channels.cache.get('959693430647308295');
				try {
					await logsChannel.send({ embeds: [log] });
				} catch (error) {
					console.error(error);
					return;
				}
				break;
		}
	}
};