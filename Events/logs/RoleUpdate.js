const { Role, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LogsChannel');
const SwitchDB = require('../../Structures/Schemas/GeneralLogs');

module.exports = {
	name: 'roleUpdate',
	/**
	 * 
	 * @param {Role} oldRole
	 * @param {Role} newRole
	 */
	async execute(oldRole, newRole) {
		const { guild, name } = newRole;



		const logsChannel = '765920602287636481';
		const Channel = await guild.channels.cache.get(logsChannel);
		if (!Channel) return;

		const Embed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTimestamp();

		return Channel.send({
			embeds: [
				Embed.setTitle(`${guild.name}'s Logs | Role Updated`),
				Embed.setDescription(`${oldRole.name} has been updated to ${name}`)
			]
		});
	}
};