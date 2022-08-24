const { ContextMenuCommandInteraction, ApplicationCommandType, EmbedBuilder, Colors } = require('discord.js');
const translate = require('@iamtraction/google-translate');

module.exports = {
	name: 'Translate Message',
	category: 'Context',
	type: ApplicationCommandType.Message,
	context: true,

	/**
	 * 
	 * @param {ContextMenuCommandInteraction} interaction 
	 */
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const { channel, targetId } = interaction;

		const query = await channel.messages.fetch({ message: targetId });
		const raw = query.content;
		const translated = await translate(query, { to: 'en' });

		return interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Green)
					.setTitle('Translation')
					.addFields([
						{ name: 'Raw', value: '```' + raw + '```', inline: true },
						{ name: 'Translation', value: '```' + translated.text + '```', inline: true }
					])
					.setFooter({ text: 'Translated by Google Translate' })
					.setTimestamp()
			]
		});
	}
};