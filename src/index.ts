import { config } from 'dotenv';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';
import express, { Router } from 'express';

import Health from './routes/health';
import apiV1Routes from './routes/apiv1';
config();

export const client = new ExtendedClient();

/**
 * The main function is the entry point of the bot. It connects to the discord servers, starts the bot, connects to the database, and sets up the process title to show the uptime of the bot.
 * @throws {Error} - thrown if there is an error connecting to the database
 */
async function main() {
	try {
		await client.start();
		const router = Router();
		const app = express();
		const port = 3000;

		await connectDatabase();
		checkVariables(process.env); // checks if any variable's values are missing in the .env


		app.get('/', (req, res) => {
			res.send('Hello, world!');
		});

		app.use('/api/v1', apiV1Routes);// /api/v1/

		apiV1Routes.get('/health', Health);// /api/v1/health

		app.listen(port, () => {
			console.log(`Server is listening http://localhost:${port}`);
		});

	} catch (error) {
		console.error(error);
		throw new Error('Error connecting to Database');
	}
}

main();