const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

module.exports = {
	name: 'ticketsetup',
	description: 'Initial Ticket Setup',
	permission: 'ADMINISTRATOR',
	/**
 * @param {CommandInteraction} interaction 
 */
	async execute(interaction) {
		const { guild, channel } = interaction;

		const embed = new MessageEmbed()
			.setColor('BLUE')
			.setAuthor({ name: `${guild.name} | Ticket System`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
			.setDescription('Open a ticket to report a Member, \nget support (``after you have checked the FAQ``) \nreport a bug in overlay expert');
		const Buttons = new MessageActionRow();
		Buttons.addComponents(
			new MessageButton().setCustomId('player').setLabel('Member Report').setStyle('PRIMARY').setEmoji('🧧'),
			new MessageButton().setCustomId('support').setLabel('Support').setStyle('SUCCESS').setEmoji('✅'),
			new MessageButton().setCustomId('bug').setLabel('Bug Report').setStyle('SECONDARY').setEmoji('🐛')
		);
		try {
			await channel.send({ embeds: [embed], components: [Buttons] });
			return interaction.reply({ content: 'done', ephemeral: true });
		} catch (error) {
			console.error(error);
		}
	}
};