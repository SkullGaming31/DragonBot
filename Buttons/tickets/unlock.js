const { MessageEmbed, ButtonInteraction } = require('discord.js');

module.exports = {
	name: 'unlock',
	permission: 'MANAGE_MESSAGES',
	/**
	 * @param {ButtonInteraction} interaction 
	 */

	async execute(interaction) {
		if (docs.locked == false)
			return interaction.reply({ content: 'this ticket is already unlocked', ephemeral: true });
		await DB.updateOne({ ChannelID: channel.id }, { Locked: false });
		embed.setDescription('🔓 | this channel has been unlocked');
		docs.MembersID.forEach((m) => {
			channel.permissionOverwrites.edit(m, {
				SEND_MESSAGES: true,
				EMBED_LINKS: true,
				ATTACH_FILES: true,
			});
		});
		interaction.reply({ embeds: [embed] });
	}
};