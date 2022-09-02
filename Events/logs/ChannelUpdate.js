const { GuildChannel, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'channelUpdate',
	/**
	 * 
	 * @param {GuildChannel} oldChannel
	 * @param {GuildChannel} newChannel 
	 */
	async execute(oldChannel, newChannel) {
		const { guild } = newChannel;

		const logsChannel = '765920602287636481';
		const Channel = await guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		if (oldChannel.topic !== newChannel.topic) {
			return Channel.send({
				embeds: [
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(`${process.env.settings} | Topic Updated`)
						.setDescription(`${newChannel}'s Topic has been changed from \`${oldChannel.topic}\` to \`${newChannel.topic}\``)
						.setTimestamp()
				]
			});
		}
	}
};