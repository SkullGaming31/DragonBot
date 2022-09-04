const { Message, EmbedBuilder, Colors, ChannelType } = require('discord.js');

module.exports = {
	name: 'messageDelete',

	/**
	 * 
	 * @param {Message} message 
	 */
	async execute(message) {
		const { guild, channel } = message;
		// console.log(message);

		const log = new EmbedBuilder()
			.setColor(Colors.Green)
			.setDescription(`🚨 a [message](${message.url}) by ${message.author.tag} was **deleted**.\n **Deleted Message:**\n \`${message.content ? message.content : 'None'}\``.slice(0, 4096));

		if (message.attachments.size >= 1) {
			log.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
		}
		if (guild.id === '183961840928292865') { // Overlay Expert
			const logsChannel = message.guild.channels.cache.get('765920602287636481');
			try {
				if (channel.type === ChannelType.GuildText) {
					await logsChannel.send({ embeds: [log] });
				}
			} catch (error) {
				console.error(error);
				return;
			}
		} else { // Overlay Expert Server
			const logsChannel = message.guild.channels.cache.get('959693430647308295');
			try {
				await logsChannel.send({ embeds: [log] });
			} catch (error) {
				console.error(error);
				return;
			}
		}
	}
};