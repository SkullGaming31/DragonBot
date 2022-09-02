const { Guild, User, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'guildBanRemove',
	/**
	 * 
	 * @param {Guild} guild
	 * @param {User} user 
	 */
	async execute(guild, user) {
		const { id, username, discriminator } = user;


		const logsChannel = '765920602287636481';
		const Channel = await guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle(`${process.env.settings}'s | User Banned`)
					.setDescription(`\`${username}#${discriminator}\`(${id}) has been removed from the ban list for this server`)
					.setTimestamp()
			]
		});
	}
};