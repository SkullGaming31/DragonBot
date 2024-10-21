import { config } from 'dotenv';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';

config();

export const client = new ExtendedClient();

/**
 * The main function is the entry point of the bot. It connects to the discord servers, starts the bot, connects to the database, and sets up the process title to show the uptime of the bot.
 * @throws {Error} - thrown if there is an error connecting to the database
 */
async function main() {
	try {
		await client.start();

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
	} catch (error) {
		console.error(error);
		throw new Error('Error connecting to Database');
	}
}

main();