// src/index.ts

import { config } from 'dotenv';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';
import express, { Request, Response } from 'express';

import Health from './routes/health';
import apiV1Routes from './routes/apiv1';
import { info } from './Utilities/logger';

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

			// Mount API routes
			this.app.use('/api/v1', apiV1Routes);
			this.app.get('/', (((req: Request, res: Response) => res.send('Hello, world!')) as unknown) as express.RequestHandler);

			// Mount health route at /api/v1/health (Health is an express router/handler)
			this.app.use('/api/v1/health', Health);

			// Respect an env-provided port, useful for containers and CI
			this.port = Number(process.env.PORT) || this.port;

			const server = this.app.listen(this.port, () => {
				console.log(`Server is listening http://localhost:${this.port}`);
			});

			// Graceful shutdown helpers so the process can close cleanly in tests or CI
			const shutdown = async (signal: string) => {
				info(`Received ${signal}, shutting down...`);
				try {
					await this.client.destroy();
					server.close(() => {
						info('HTTP server closed');
						process.exit(0);
					});
				} catch (err) {
					console.error('Error during shutdown', err);
					process.exit(1);
				}
			};
			process.on('SIGINT', () => shutdown('SIGINT'));
			process.on('SIGTERM', () => shutdown('SIGTERM'));

			// Global runtime error handlers to ensure we log crashes before exiting
			process.on('unhandledRejection', async (reason, promise) => {
				try {
					info('unhandledRejection: Caught unhandled promise rejection');
					console.error('Unhandled Rejection at:', promise, 'reason:', reason);
					await shutdown('unhandledRejection');
				} catch (err) {
					console.error('Error during unhandledRejection shutdown', err);
					process.exit(1);
				}
			});

			process.on('uncaughtException', async (err) => {
				try {
					info('uncaughtException: Caught exception');
					console.error('Uncaught Exception:', err);
					await shutdown('uncaughtException');
				} catch (err2) {
					console.error('Error during uncaughtException shutdown', err2);
					process.exit(1);
				}
			});
		} catch (error) {
			console.error(error);
			throw new Error('Error connecting to Database');
		}
	}
}

export const appInstance = new App();

// Only start the app automatically when this file is the main module.
// This prevents the app from auto-starting when imported for testing or debugging.
if (typeof require !== 'undefined' && require.main === module) {
	appInstance.start();
}