const { MessageEmbed, Message, WebhookClient } = require('discord.js');

module.exports = {
	name: 'messageDelete',

	/**
	 * 
	 * @param {Message} message 
	 */
	async execute(message) {
		if (message.author.bot) return;

		const log = new MessageEmbed()
			.setColor('GREEN')
			.setDescription(`🚨 a [message](${message.url}) by ${message.author.tag} was **deleted**.\n **Deleted Message:**\n ${message.content ? message.content : 'None'}`.slice(0, 4096));

		if (message.attachments.size >= 1) {
			log.addField('Attachments:', `${message.attachments.map(a => a.url)}`, true);
		}
		new WebhookClient({ url: 'https://discord.com/api/webhooks/960533765111812156/m1T7GKMpBvi4daJDTwMrrh3XkrnWC21BNN2-RC8xLDKwtikFfgpuOP3lMAmVEQnCl7DQ' }
		).send({ embeds: [log] }).catch((err) => {
			console.error(err);
		});
	}
};