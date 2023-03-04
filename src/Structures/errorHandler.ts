import { EmbedBuilder, Colors, WebhookClient } from "discord.js";
import { ExtendedClient } from "./Client";

async function errorHandler(client: ExtendedClient) {
    const errorLogs = process.env.DEV_ERROR_LOGS_CHANNEL;
    const WebHookID = process.env.DISCORD_ERR_WEBHOOK_ID;
    const WebHookToken = process.env.DISCORD_ERR_WEBHOOK_TOKEN;
    console.log('Error Handler Ready!');

	const Embed = new EmbedBuilder()
		.setColor(Colors.Blue)
		.setTitle('⚠ | Error Encountered')
		.setFooter({ text: 'Anti-Crash by DragoLuca' })
		.setTimestamp();

	const errorHook = new WebhookClient({
        id: `${WebHookID}`,
        token: `${WebHookToken}`
    })


	process.on('unhandledRejection', async (reason, p) => {
		console.log(reason, p);
		// const Channel = client.channels.cache.get(DEV_ERROR_LOGS_CHANNEL);
		// if (!Channel) return;

		await errorHook.send({ embeds: [Embed.setDescription('**Unhandled Rejection/Catch: \n\n** ```' + reason + '```')] });
		return;
	});
	process.on('uncaughtException', async (err, orgin) => {
		console.log(err, orgin);
		// const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
		// if (!Channel) return;

		await errorHook.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch:\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
		return;
	});
	process.on('uncaughtException', async (err, orgin) => {
		console.log(err, orgin);
		// const Channel = client.channels.cache.get(ERROR_LOGS_CHANNEL);
		// if (!Channel) return;

		await errorHook.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch: (MONITOR)\n\n** ```' + err + '\n\n' + orgin.toString() + '```')] });
		return;
	});
}

export default errorHandler;
