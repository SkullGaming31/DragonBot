const { MessageEmbed, Message, WebhookClient } = require('discord.js');

module.exports = {
	name: 'messageDelete',

	/**
	 * 
	 * @param {Message} message 
	 */
	async execute(message) {
		if (message.author.bot) return;
		const { guild } = message;

		const log = new MessageEmbed()
			.setColor('GREEN')
			.setDescription(`🚨 a [message](${message.url}) by ${message.author.tag} was **deleted**.\n **Deleted Message:**\n ${message.content ? message.content : 'None'}`.slice(0, 4096));

		if (message.attachments.size >= 1) {
			log.addField('Attachments:', `${message.attachments.map(a => a.url)}`, true);
		}
		if (guild.id === '183961840928292865') { // Overlay Expert
			new WebhookClient({
				id: '961128335281356810',
				token: 'VM0x1nO83xzEu3_UQp1ETFmJhECfnJocyETx7AnQODr34zdpAkLu1CCFUtZ1HHiz4q6R'
			}
			).send({ embeds: [log] }).catch((err) => {
				console.error(err);
			});
		} else { // OE Test Server
			new WebhookClient({ id: '961130182087958528', token: 'RQ9OmL1KMc3ZTFnmZGl7WU-tXvCN7uEqZK-6iggjsW4jBDOCjnFMNPieDa11LxS45-Kq' }
			).send({ embeds: [log] }).catch((err) => {
				console.error(err);
			});
		}
	}
};