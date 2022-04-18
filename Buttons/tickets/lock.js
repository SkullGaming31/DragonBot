const { MessageEmbed, ButtonInteraction } = require('discord.js');
const DB = require('../../Structures/Schemas/Ticket');
// const TicketSetupData = require('../../Structures/Schemas/TicketSetup');

module.exports = {
	name: 'lock',
	permission: 'MANAGE_MESSAGES',
	/**
	 * 
	 * @param {ButtonInteraction} interaction 
	 * @returns 
	 */

	async execute(interaction) {
		if (docs.locked == true)
			return interaction.reply({ content: 'this ticket is already Locked', ephemeral: true });
		await DB.updateOne({ ChannelID: channel.id }, { Locked: true });
		embed.setDescription('🔒 | this channel is now locked Pending Review');

		docs.MembersID.forEach((m) => {
			channel.permissionOverwrites.edit(m, {
				SEND_MESSAGES: false,
				EMBED_LINKS: false,
				ATTACH_FILES: false,
			});
		});
		interaction.reply({ embeds: [embed] });
	}
};