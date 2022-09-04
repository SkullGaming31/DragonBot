/* eslint-disable indent */
const { Client, Message, EmbedBuilder, WebhookClient, Colors } = require('discord.js');

module.exports = {
	name: 'messageUpdate',
	/**
	 * 
	 * @param {Message} oldMessage 
	 * @param {Message} newMessage 
	 * @param {Client} client
	 * @returns 
	 */
	async execute(oldMessage, newMessage, client) {
		const { guild } = newMessage;

		if (oldMessage.content === newMessage.content) return;

		const Count = 1950;

		const Original = oldMessage.content.slice(0, Count) + (oldMessage.content.length > Count ? ' ...' : '');
		const Edited = newMessage.content.slice(0, Count) + (newMessage.content.length > Count ? ' ...' : '');

		const log = new EmbedBuilder()
			.setColor(Colors.Yellow)
			.setDescription(`📘 A [message](${newMessage.url} by ${newMessage.author} was **edited** in ${newMessage.channel}.\n
				**Original**:\n ${Original} \n**Edited**: \n ${Edited}`)
			.setFooter({ text: `Member: ${newMessage.author.tag} | ID: ${newMessage.author.id}` });

		switch (guild.id) {
			case '959693430227894292':// Overlay Expert Discord Test Server
				const testServerLogsChannel = client.channels.cache.get('959693430647308295');
				try {
					await testServerLogsChannel.send({ embeds: [log] });
				} catch (error) {
					console.error(error);
					return;
				}
				break;
			case '183961840928292865':// Overlay Expert Logs Channel
				const logsChannel = client.channels.cache.get('765920602287636481');
				try {
					await logsChannel.send({ embeds: [log] });
				} catch (error) {
					console.error(error);
					return;
				}
				break;
		}

		if (newMessage.guild.id === '959693430227894292') { // Discord Bot Test Server
			const logsChannel = client.channels.cache.get('959693430647308295');
			try {
				await logsChannel.send({ embeds: [log] });
			} catch (error) {
				console.error(error);
				return;
			}
		} else { // Overlay Expert Server
			const logsChannel = client.channels.cache.get('765920602287636481');
			try {
				await logsChannel.send({ embeds: [log] });
			} catch (error) {
				console.error(error);
				return;
			}
		}
	}
};