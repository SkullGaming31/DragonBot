import { EmbedBuilder, Colors, WebhookClient, ChannelType } from 'discord.js';
import { ExtendedClient } from './Client';

async function errorHandler(client: ExtendedClient) {
	const errorLogs = process.env.DEV_ERROR_LOGS_CHANNEL;
	// const WebHookID = `${process.env.DISCORD_ERR_WEBHOOK_ID}`;
	// const WebHookToken = `${process.env.DISCORD_ERR_WEBHOOK_TOKEN}`;

	if (process.env.Enviroment === 'debug') {
		console.time('Error Handler Ready!');
	} else {
		console.log('Error Handler Ready');
	}

	const Embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle('⚠ | Error Encountered')
		.setFooter({ text: 'Anti-Crash by DragoLuca' })
		.setTimestamp();

	// const errorHook = new WebhookClient({
	//     id: `${WebHookID}`,
	//     token: `${WebHookToken}`
	// });


	process.on('unhandledRejection', async (reason, p) => {
		console.log(reason, p);
		const Channel = client.channels.cache.get('961753379405692969');
		if (!Channel) return;

		if (Channel.type === ChannelType.GuildText)
			await Channel.send({ embeds: [Embed.setDescription('**Unhandled Rejection/Catch: \n\n** ```' + reason + '```')] });
		return;
	});
	process.on('uncaughtException', async (err, orgin) => {
		console.log(err, orgin);
		const Channel = client.channels.cache.get('961753379405692969');
		if (!Channel) return;

		if (Channel.type === ChannelType.GuildText)
			await Channel.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch:\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
		return;
	});
	process.on('uncaughtException', async (err, orgin) => {
		console.log(err, orgin);
		const Channel = client.channels.cache.get('961753379405692969');
		if (!Channel) return;

		if (Channel.type === ChannelType.GuildText)
			await Channel.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch: (MONITOR)\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
		return;
	});
}

export default errorHandler;
