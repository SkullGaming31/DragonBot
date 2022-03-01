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

		new WebhookClient({ url: 'https://discord.com/api/webhooks/944405199102025790/BUULFqS4comn99ZZwkU71DLyHdPtT3wmIST_47HjqTLd8mJqJcL5Hc9OoO4VNq12acnS' }).send({embeds: [log]}).catch((err) => {
			console.error(err);
		});
	}
};