// import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
// import { client } from "index";

// export default errorHandler(client) {

// 	const Embed = new EmbedBuilder()
// 		.setColor(Colors.Blue)
// 		.setTitle('⚠ | Error Encountered')
// 		.setFooter({ text: 'Anti-Crash by DragoLuca' })
// 		.setTimestamp();

// 	const errorHook = new WebhookClient({ id: DISCORD_ERR_WEBHOOK_ID, token: DISCORD_ERR_WEBHOOK_TOKEN });

// 	process.on('unhandledRejection', (reason, p) => {
// 		console.log(reason, p);
// 		const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
// 		if (!Channel) return;

// 		errorHook.send({ embeds: [Embed.setDescription('**Unhandled Rejection/Catch: \n\n** ```' + reason + '```')] });
// 		return;
// 	});
// 	process.on('uncaughtException', (err, orgin) => {
// 		console.log(err, orgin);
// 		const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
// 		if (!Channel) return;

// 		errorHook.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch:\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
// 		return;
// 	});
// 	process.on('uncaughtException', (err, orgin) => {
// 		console.log(err, orgin);
// 		const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
// 		if (!Channel) return;

// 		errorHook.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch: (MONITOR)\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
// 		return;
// 	});
// }