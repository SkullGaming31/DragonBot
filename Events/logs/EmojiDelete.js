const { GuildEmoji, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'emojiDelete',
	/**
	 * 
	 * @param {GuildEmoji} channel 
	 */
	async execute(emoji) {
		const { guild, id } = emoji;


		const logsChannel = '765920602287636481';
		const Channel = await guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle(`${process.env.settings}'s | Emoji Deleted`)
					.setDescription(`an emoji has been removed from the server: ${emoji}, \`${id}\``)
					.setTimestamp()
			]
		});
	}
};