import { EmbedBuilder, WebhookClient } from 'discord.js';

async function errorHandler(errorHook: WebhookClient) {
	const Embed = new EmbedBuilder().setColor('DarkRed').setTitle('⚠ | Error Encountered').setFooter({ text: 'Anti-Crash by DragoLuca' }).setTimestamp();


	process.on('unhandledRejection', async (reason: unknown, p: Promise<unknown>) => {
		console.log(reason, p);

		await errorHook.send({ embeds: [Embed.setDescription('**Unhandled Rejection/Catch: \n\n** ```' + reason + '```')] });
		return;
	});
	process.on('uncaughtException', async (err: Error, orgin: NodeJS.UncaughtExceptionOrigin) => {
		console.log(err, orgin);

		await errorHook.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch:\n\n** ```' + err + '\n\n' + orgin.toString() + '```').setTitle(err.name)] });
		return;
	});
	process.on('uncaughtException', async (err: Error, orgin: NodeJS.UncaughtExceptionOrigin) => {
		console.log(err, orgin);

		await errorHook.send({ embeds: [Embed.setDescription('**Uncaught Exception/Catch: (MONITOR)\n\n** ```' + err + '\n\n' + orgin.toString() + '```').setTitle(err.name)] });
		return;
	});
}

export default errorHandler;
