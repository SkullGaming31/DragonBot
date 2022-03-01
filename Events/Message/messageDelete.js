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
		new WebhookClient({ url: 'https://discord.com/api/webhooks/944405199102025790/BUULFqS4comn99ZZwkU71DLyHdPtT3wmIST_47HjqTLd8mJqJcL5Hc9OoO4VNq12acnS'}
		).send({ embeds: [log]}).catch((err) => {
			console.error(err);
		});
	}
};