const { MessageEmbed, GuildMember } = require('discord.js');

module.exports = {
	name: 'guildMemberRemove',

	/**
   * @param {GuildMember} member 
   */
	async execute(member) {
		const { guild, user } = member;

		const targetChannel = guild.channels.cache.get('959693430647308295');

		const leftServer = new MessageEmbed()
			.setTitle(`${guild.name}`)
			.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` })
			.setDescription(`${user}`)
			.setThumbnail(`${guild.iconURL({ dynamic: true }) || ''}`)
			.setFooter({ text: 'Left Server' })
			.setTimestamp();
		switch(guild.id) {
		case '959693430227894292':
			/* if (targetChannel.isText()) return  */await targetChannel.send({ embeds: [leftServer] });
			break;
		case '183961840928292865':
			break;
		}
	}
};