const { MessageEmbed, Message, WebhookClient } = require('discord.js');

module.exports = {
	name: 'messageUpdate',
	/**
 * 
 * @param {Message} oldMessage 
 * @param {Message} newMessage 
 */
	async execute(oldMessage, newMessage) {
		if (oldMessage.author.bot) return;

		if (oldMessage.content === newMessage.content) return;

		const Count = 1950;

		const Original = oldMessage.content.slice(0, Count) + (oldMessage.content.length > Count ? ' ...' : '');
		const Edited = newMessage.content.slice(0, Count) + (newMessage.content.length > Count ? ' ...' : '');

		const log = new MessageEmbed()
			.setColor('YELLOW')
			.setDescription(`📘 A [message](${newMessage.url}) by ${newMessage.author} was **edited** in ${newMessage.channel}.\n
		**Original**:\n ${Original} \n**Edited**: \n ${Edited}`)
			.setFooter({ text: `Member: ${newMessage.author.tag} | ID: ${newMessage.author.id}` });

		if (oldMessage.guild.id === '183961840928292865') { // Overlay Expert
			new WebhookClient({
				id: '961128335281356810',
				token: 'VM0x1nO83xzEu3_UQp1ETFmJhECfnJocyETx7AnQODr34zdpAkLu1CCFUtZ1HHiz4q6R'
			}
			).send({ embeds: [log] }).catch((err) => {
				console.error(err);
			});
		} else { // OE Test Server
			new WebhookClient({
				id: '961130182087958528',
				token: 'RQ9OmL1KMc3ZTFnmZGl7WU-tXvCN7uEqZK-6iggjsW4jBDOCjnFMNPieDa11LxS45-Kq'
			}
			).send({ embeds: [log] }).catch((err) => {
				console.error(err);
			});
		}
	}
};