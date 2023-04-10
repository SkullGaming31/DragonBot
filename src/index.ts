import startApi from './Api';
import { ExtendedClient } from './Structures/Client';
import { config } from 'dotenv';
import errorHandler from './Structures/errorHandler';
import { checkVariables } from './Structures/checkVariables';
import { connectDatabase } from './Database';
import { WebhookClient } from 'discord.js';

config();

export const client = new ExtendedClient();
client.start();

async function main() {
	const WebHookID = process.env.DISCORD_ERR_WEBHOOK_ID as string;
	const WebHookToken = process.env.DISCORD_ERR_WEBHOOK_TOKEN as string;

	const errorHook = new WebhookClient({ id: WebHookID, token: WebHookToken, });
	await errorHandler(errorHook);
	await connectDatabase();
	await startApi();
	checkVariables(process.env); // checks if any variable's values are missing in the .env
}

main();