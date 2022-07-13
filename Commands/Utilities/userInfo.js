const { ContextMenuInteraction, MessageEmbed } = require('discord.js');
const DB = require('../../Structures/Schemas/WarningDB');

module.exports = {
	name: 'userinfo',
	type: 'USER',
	context: true,
	public: true,
	permission: 'MANAGE_MESSAGES',
	/**
	 *
	 * @param {ContextMenuInteraction} interaction
	 */
	async execute(interaction) {
		if (!interaction.isContextMenu()) return;
		const { guild } = interaction;
		// console.log(interaction.user);
		const target = await guild.members.fetch(interaction.targetId);

		const response = new MessageEmbed()
			.setTitle(`${guild.name}`)
			.setColor('BLUE')
			.setAuthor({ name: `${target.displayName}`/* , iconURL: `${target.displayAvatarURL}` */ })
			// .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 512 }))
			.addField('UserID', `${target.user.id}`, true)
			.addField('Roles', `${target.roles.cache.map((r) => r).join(' ').replace('@everyone', '') || 'None'}`)
			.addField('Member Since', `<t:${parseInt(target.joinedTimestamp / 1000)}:R>`, true)
			.addField('Discord User Since', `<t:${parseInt(target.user.createdTimestamp / 1000)}:R>`, true)
			.setFooter({ text: `GuildID: ${guild.id}`, iconURL: `${guild.iconURL({ dynamic: true }) || ''}` });

		interaction.reply({ embeds: [response], ephemeral: true });
	},
};
