const { GuildEmoji, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'emojiCreate',
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
					.setTitle(`${process.env.settings}'s | Emoji Created`)
					.setDescription(`an emoji has been added to the server: ${emoji}, \`${id}\``)
					.setTimestamp()
			]
		});
	}
};