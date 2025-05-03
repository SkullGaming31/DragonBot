// src/index.ts

import { config } from 'dotenv';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';
import express, { Request, Response } from 'express';

import Health from './routes/health';
import apiV1Routes from './routes/apiv1';

class App {
	public client: ExtendedClient;
	public app: express.Application;
	private port: number;

	constructor() {
		config();
		this.client = new ExtendedClient();
		this.app = express();
		this.port = 3000;
	}

	async start() {
		try {
			await this.client.start();
			await connectDatabase();
			checkVariables(process.env);

			this.app.use('/api/v1', apiV1Routes);
			this.app.get('/', (req: Request, res: Response) => {
				res.send('Hello, world!');
			});
			apiV1Routes.get('/health', Health);

			this.app.listen(this.port, () => {
				console.log(`Server is listening http://localhost:${this.port}`);
			});
		} catch (error) {
			console.error(error);
			throw new Error('Error connecting to Database');
		}
	}
}

export const appInstance = new App();

appInstance.start();