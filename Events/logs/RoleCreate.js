const { Role, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'roleCreate',
	/**
	 * 
	 * @param {Role} role
	 */
	async execute(role) {
		const { guild, name } = role;


		const logsChannel = '765920602287636481';
		const Channel = await guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		const Embed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTimestamp();

		return Channel.send({
			embeds: [
				Embed.setTitle(`${process.env.Settings} | Role Created`),
				Embed.setDescription(`a role has been created named: ${role}, \`${name}\``)
			]
		});
	}
};