const { GuildChannel, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'channelCreate',
	/**
	 * 
	 * @param {GuildChannel} channel 
	 */
	async execute(channel) {
		const { guild, name } = channel;

		const logsChannel = '765920602287636481';
		const Channel = guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setDescription(`a channel has been created named: ${channel}, **${name}**`)
					.setTimestamp()
			]
		});
	}
};