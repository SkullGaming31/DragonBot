import { WebhookClient } from 'discord.js';
import { config } from 'dotenv';
import startApi from './Api';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';
import errorHandler from './Structures/errorHandler';

config();

export const client = new ExtendedClient();

async function main() {
	await client.start();
	const WebHookID = process.env.DISCORD_ERR_WEBHOOK_ID as string;
	const WebHookToken = process.env.DISCORD_ERR_WEBHOOK_TOKEN as string;

	const errorHook = new WebhookClient({ id: WebHookID, token: WebHookToken, });
	await errorHandler(errorHook);
	await connectDatabase();
	startApi();
	checkVariables(process.env); // checks if any variable's values are missing in the .env
}

main();