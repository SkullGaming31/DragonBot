const { ButtonInteraction, MessageEmbed } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const DB = require('../../Structures/Schemas/Ticket');
// const TicketSetupData = require('../../Structures/Schemas/TicketSetup');

module.exports = {
	id: 'close',
	permission: 'MANAGE_MESSAGES',
	/**
   * 
   * @param {ButtonInteraction} interaction 
   * @param {discordTranscripts} discordTranscripts
   * @returns 
   */
	async execute(interaction) {
		if (docs.Closed)
			return interaction.reply({ content: 'Ticket is already closed, please wait for it to be automatically deleted', ephemeral: true });
		const attachments = await discordTranscripts.createTranscript(
			channel,
			{
				limit: -1,
				returnBuffer: false,
				fileName: `${docs.Type} - ${docs.TicketID}.html`,
			}
		);
		await DB.updateOne({ ChannelID: channel.id }, { Closed: true });
		const Message = await guild.channels.cache.get(TicketSetup.Transcripts)
			.send({
				embeds: [
					embed.setTitle(
						`Transcript Type: ${docs.Type}\nID: ${docs.TicketID}`
					),
				],
				files: [attachments],
			});
		interaction.reply({ content: 'The channel will deleted in 10 seconds.', embeds: [embed.setDescription(`the transcript is now saved [TRANSCRIPT](${Message.url})`),],});
		setTimeout(() => {
			channel.delete();
		}, 10 * 1000);

		await DB.deleteOne({ ChannelID: channel.id });
	},
};