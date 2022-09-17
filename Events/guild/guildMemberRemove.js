const { GuildMember } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'guildMemberRemove',
	/**
	 * 
	 * @param {GuildMember} member 
	 */
	async execute(member) {
		const { guild, user } = member;
		const Data = await DB.findOne({ GuildID: guild.id });
		const Channel = guild.channels.cache.get(Data.WelcomeChannel);

		if (!Channel) return;

		if (Data.Welcome === true) {
			Channel.send({ content: `${user.username} has left the server` });
		} else return;
	}
};