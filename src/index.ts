// src/index.ts

import { config } from 'dotenv';
import { connectDatabase } from './Database';
import { ExtendedClient } from './Structures/Client';
import { checkVariables } from './Structures/checkVariables';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

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

			// Security middleware
			this.app.use(helmet());
			this.app.use(express.json());
			this.app.use(express.urlencoded({ extended: true }));
			// Configure CORS: default to same-origin; allow override via CORS_ORIGIN env var
			const corsOptions = process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined;
			this.app.use(cors(corsOptions));

			// Basic rate limiter for API routes
			const apiLimiter = rateLimit({
				windowMs: 15 * 60 * 1000, // 15 minutes
				max: 200, // limit each IP to 200 requests per windowMs
				standardHeaders: true,
				handler: (req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' })
			});
			this.app.use('/api/', apiLimiter);

			// Simple API key middleware for /api/v1 routes in non-dev environments
			const apiKey = process.env.API_KEY;
			const requireApiKey = (req: Request, res: Response, next: NextFunction): void => {
				// In development, allow requests without API key for convenience
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { next(); return; }
				const provided = req.header('x-api-key') || req.query.api_key;
				if (!apiKey) { res.status(500).json({ error: 'API key not configured on server' }); return; }
				if (!provided || provided !== apiKey) { res.status(401).json({ error: 'Unauthorized' }); return; }
				next();
			};

			// Mount API routes (protected)
			this.app.use('/api/v1/health', Health); // keep health minimal and separate
			this.app.use('/api/v1', requireApiKey, apiV1Routes);
			this.app.get('/', (((req: Request, res: Response) => res.send('Hello, world!')) as unknown) as express.RequestHandler);

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