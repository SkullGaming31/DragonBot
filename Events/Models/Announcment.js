const { ModalSubmitInteraction, InteractionType, EmbedBuilder } = require('discord.js');
const editReply = require('../../Systems/editReply');
module.exports = {
	name: 'interactionCreate',

	/**
	 * 
	 * @param {ModalSubmitInteraction} interaction 
	 */
	async execute(interaction) {
		const { type, customId, channel, guild, user, fields } = interaction;
		const systemMessage = guild.channels.cache.get('959694147093159947');

		if (type !== InteractionType.ModalSubmit) return;
		if (!guild || user.bot) return;

		if (customId !== 'announce-model') return;

		await interaction.deferReply({ ephemeral: true });
		const messageInput = fields.getTextInputValue('message-input');

		const Embed = new EmbedBuilder()
			.setColor('Blue')
			.setTitle('New Accouncement')
			.setDescription(messageInput)
			.setThumbnail(guild.iconURL({ size: 512 }))
			.setTimestamp();

		editReply(interaction, '📢', `Announcment is now live in ${systemMessage}`);

		systemMessage.send({ content: '@everyone', embeds: [Embed] }).then(async (msg) => {
			await msg.react('👍');
			await msg.react('👎');
		});
	}
};