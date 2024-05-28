import { config } from 'dotenv';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';

config();

export const client = new ExtendedClient();

async function main() {
	await client.start();

	// const errorHook = new WebhookClient({ id: WebHookID, token: WebHookToken, });
	await connectDatabase();
	checkVariables(process.env); // checks if any variable's values are missing in the .env

	// Function to update the process title with the bot's uptime
	function updateProcessTitle() {
		const uptime = process.uptime();
		const weeks = Math.floor(uptime / (3600 * 24 * 7));
		const days = Math.floor((uptime % (3600 * 24 * 7)) / (3600 * 24));
		const hours = Math.floor((uptime % (3600 * 24)) / 3600);
		const minutes = Math.floor((uptime % 3600) / 60);
		const seconds = Math.floor(uptime % 60);
		process.title = `Uptime: ${weeks}w ${days}d ${hours}h ${minutes}m ${seconds}s`;
	}

	// Update process title every second
	setInterval(updateProcessTitle, 30000);
}

main();