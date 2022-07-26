const { Guild, WebhookClient, Colors, EmbedBuilder } = require('discord.js');
const { NEW_GUILD_ADDED_WEBHOOK } = require('../../Structures/config');
module.exports = {
	name: 'guildDelete',
	/** 
	 * @param {Guild} guild 
	 */
	async execute(guild) {
		const newGuild = await guild.fetch();
		const guildOwner = await guild.fetchOwner();

		const embed = new EmbedBuilder()
			.setTitle('NEW GUILD ADDED')
			.setThumbnail(newGuild.iconURL({ dynamic: true }))
			.setAuthor({ name: guildOwner.displayName, iconURL: guildOwner.displayAvatarURL({ dynamic: true }) })
			.setColor(Colors.Green)
			.setFooter({ text: `GuildID: ${guild.id}`, iconURL: guild.iconURL({ dynamic: true }) })
			.setTimestamp();
	}
};