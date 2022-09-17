const { ChatInputCommandInteraction, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
module.exports = {
	name: 'announce',
	description: 'Make an Announcment',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	category: 'Utility',

	/**
	 * 
	 * @param {ChatInputCommandInteraction} interaction 
	 */
	async execute(interaction) {
		// const { } = interaction;

		const modal = new ModalBuilder()
			.setCustomId('announce-model')
			.setTitle('Make an announcment to the server.');

		const AnnouncementInput = new TextInputBuilder()
			.setCustomId('message-input')
			.setLabel('Announcement Message')
			.setMinLength(1)
			.setMaxLength(2000)
			.setPlaceholder('What is the current Announcement message you would like to send to the server, no embed features')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		const row = new ActionRowBuilder().addComponents(AnnouncementInput);

		modal.addComponents(row);
		await interaction.showModal(modal);
	}
};