const { ButtonInteraction, MessageEmbed } = require('discord.js');
const DB = require('../../Structures/Schemas/Ticket');
// const TicketSetupData = require('../../Structures/Schemas/TicketSetup');

module.exports = {
	name: 'claim',
	permission: 'MANAGE_MESSAGES',
	/**
   * 
   * @param {ButtonInteraction} interaction 
   */

	async execute(interaction) {
		if (docs.Claimed == true)
			return interaction.reply({ content: `this ticket has already been claimed by <@${docs.ClaimedBy}>`, ephemeral: true });
		await DB.updateOne({ ChannelID: channel.id }, { Claimed: true, ClaimedBy: member.id });

		embed.setDescription(`🛄 | this ticket is now claimed by ${member}`);
		interaction.reply({ embeds: [embed] });
	}
};