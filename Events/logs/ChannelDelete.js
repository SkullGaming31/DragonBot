const { GuildChannel, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'channelDelete',
	/**
	 * 
	 * @param {GuildChannel} channel 
	 */
	async execute(channel) {
		const { guild, name } = channel;

		const logsChannel = '765920602287636481';
		const Channel = await guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setDescription(`a channel has been Deleted Named: ${channel}, **${channel.name}**`)
					.setTimestamp()
			]
		});
	}
};