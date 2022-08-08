const { Client, EmbedBuilder, Colors } = require('discord.js');
const { ERROR_LOGS_CHANNEL } = require('../config');

/**
 * @param {Client} client
 */
module.exports = async (client) => {
	const Embed = new EmbedBuilder()
		.setColor(Colors.Blue)
		.setTitle('⚠ | Error Encountered')
		.setFooter({ text: 'Anti-Crash by DragoLuca' })
		.setTimestamp();

	process.on('unhandledRejection', (reason, p) => {
		console.log(reason, p);
		const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
		if (!Channel) return;

		Channel.send({ embeds: [Embed.setDescription('**Unhandled Rejection/Catch: \n\n** ```' + reason + '```')] });
		return;
	});
	process.on('uncaughtException', (err, orgin) => {
		console.log(err, orgin);
		const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
		if (!Channel) return;

		Channel.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch:\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
		return;
	});
	process.on('uncaughtException', (err, orgin) => {
		console.log(err, orgin);
		const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
		if (!Channel) return;

		Channel.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch: (MONITOR)\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
		return;
	});
};