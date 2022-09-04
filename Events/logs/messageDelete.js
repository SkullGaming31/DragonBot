/* eslint-disable indent */
const { Message, EmbedBuilder, Colors, ChannelType } = require('discord.js');

module.exports = {
	name: 'messageDelete',

	/**
	 * 
	 * @param {Message} message 
	 */
	async execute(message) {
		const { guild, channel } = message;

		const log = new EmbedBuilder()
			.setTitle('MESSAGE DELETED')
			.setColor(Colors.Green)
			.setAuthor({ name: `${message.author.tag}` })
			.setDescription(`🚨 **Deleted Message:**\n \`${message.content ? message.content : 'None'}\``.slice(0, 4096))
			.setURL(`${message.url}`);

		if (message.attachments.size >= 1) {
			log.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
		}
		switch (guild.id) {
			case '183961840928292865':// Overlay Expert
				const overlaylogsChannel = message.guild.channels.cache.get('765920602287636481');
				try {
					if (channel.type === ChannelType.GuildText) {
						await overlaylogsChannel.send({ embeds: [log] });
					}
				} catch (error) {
					console.error(error);
					return;
				}
				break;
			case '959693430227894292':// Overlay Expert Test Server
				const logsChannel = message.guild.channels.cache.get('959693430647308295');
				try {
					await logsChannel.send({ embeds: [log] });
				} catch (error) {
					console.error(error);
					return;
				}
				break;
		}
		// if (guild.id === '183961840928292865') { // Overlay Expert
		// 	const logsChannel = message.guild.channels.cache.get('765920602287636481');
		// 	try {
		// 		if (channel.type === ChannelType.GuildText) {
		// 			await logsChannel.send({ embeds: [log] });
		// 		}
		// 	} catch (error) {
		// 		console.error(error);
		// 	}
		// } else { // Overlay Expert Server
		// 	const logsChannel = message.guild.channels.cache.get('959693430647308295');
		// 	try {
		// 		await logsChannel.send({ embeds: [log] });
		// 	} catch (error) {
		// 		console.error(error);
		// 	}
		// }
	}
};