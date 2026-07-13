// src/index.ts

import fs from 'fs/promises';
import path from 'path';
import fsSync from 'fs';

// Mirror console output into devLogs/logs.log without calling `logger` to avoid recursion.
// Placed before other imports so any console output from module initialization
// (for example in `Structures/Client`) is captured.
const _origLog = console.log.bind(console);
const _origWarn = console.warn.bind(console);
const _origError = console.error.bind(console);
const writeConsoleLog = async (level: 'INFO' | 'WARN' | 'ERROR', args: unknown[]) => {
	try {
		const line = `${new Date().toISOString()} [${level}] ${args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}\n`;
		const logsDir = path.resolve(process.cwd(), 'devLogs');
		await fs.mkdir(logsDir, { recursive: true });
		await fs.appendFile(path.join(logsDir, 'logs.log'), line);
	} catch { /* ignore file errors */ }
};
console.log = (...args: unknown[]) => {
	_origLog(...args);
	void writeConsoleLog('INFO', args);
};
console.warn = (...args: unknown[]) => {
	_origWarn(...args);
	void writeConsoleLog('WARN', args);
};
console.error = (...args: unknown[]) => {
	_origError(...args);
	void writeConsoleLog('ERROR', args);
};

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
import { createIntegrationRouter } from './Integrations/webhookHandler';
import { info, warn as logWarn, error as logError } from './Utilities/logger';
import errorHandler from './Structures/errorHandler';
import mongoose from 'mongoose';

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
				// Only accept API key via `x-api-key` header to avoid leaking secrets in URLs
				const provided = req.header('x-api-key');
				if (!apiKey) { res.status(500).json({ error: 'API key not configured on server' }); return; }
				if (!provided || provided !== apiKey) { res.status(401).json({ error: 'Unauthorized' }); return; }
				next();
			};

			// Mount API routes (protected)
			this.app.use('/api/v1/health', Health); // keep health minimal and separate
			this.app.use('/api/v1', requireApiKey, apiV1Routes);

			// Mount integrations router (decoupled) after client is available
			try {
				this.app.use('/integrations', createIntegrationRouter(this.client));
			} catch (e) {
				logError('Failed to mount integrations router', { error: (e as Error)?.message ?? e });
			}
			this.app.get('/', (((req: Request, res: Response) => res.send('Hello, world!')) as unknown) as express.RequestHandler);

			// Respect an env-provided port, useful for containers and CI
			this.port = Number(process.env.PORT) || this.port;

			const server = this.app.listen(this.port, () => {
				info(`[Server:] listening http://localhost:${this.port}`);
			});

			// Graceful shutdown helpers so the process can close cleanly in tests or CI
			const shutdown = async (signal: string) => {
				info(`Received ${signal}, shutting down...`);
				try {
					// stop periodic cleanup job if it was started
					try {
						const maybe = this.client as unknown as { __reactionCleanupStop?: (() => void) };
						const stop = maybe.__reactionCleanupStop;
						if (typeof stop === 'function') stop();
					} catch {
						// ignore
					}
					try {
						const maybeMetrics = this.client as unknown as { __metricsStop?: (() => void) };
						const stopMetrics = maybeMetrics.__metricsStop;
						if (typeof stopMetrics === 'function') stopMetrics();
					} catch {
						// ignore
					}

					await this.client.destroy();
					server.close(() => {
						info('HTTP server closed');
						process.exit(0);
					});
					await mongoose.disconnect();
				} catch (err) {
					logError('Error during shutdown', { error: (err as Error)?.message ?? err });
					process.exit(1);
				}
			};
			// Register centralized error handlers (errorHandler will call our shutdown)
			await errorHandler(shutdown);
		} catch (error) {
			// Surface the original error to aid debugging instead of hiding it behind a generic message
			logError('Startup error', { error: (error as Error)?.message ?? error });
			throw error;
		}
	}
}

export const appInstance = new App();

// Only start the app automatically when this file is the main module.
// This prevents the app from auto-starting when imported for testing or debugging.
const sentinelPath = path.resolve(process.cwd(), '.no_autorun');
const lockPath = path.resolve(process.cwd(), '.bot.pid');
if (process.env.DISABLE_AUTOSTART === 'true' || fsSync.existsSync(sentinelPath)) {
	info('Auto-start disabled (DISABLE_AUTORUN or .no_autorun present)');
} else if (typeof require !== 'undefined' && require.main === module) {
	// Single-instance lock: if another process holds the PID file and is alive, exit.
	try {
		if (fsSync.existsSync(lockPath)) {
			const raw = fsSync.readFileSync(lockPath, 'utf8').trim();
			const otherPid = Number(raw) || NaN;
			if (!Number.isNaN(otherPid)) {
				try {
					process.kill(otherPid, 0);
					info(`Another instance is already running (PID ${otherPid}), exiting.`);
					process.exit(0);
				} catch {
					// Process not running; remove stale lock
					try { fsSync.unlinkSync(lockPath); } catch { /** */ }
				}
			} else {
				try { fsSync.unlinkSync(lockPath); } catch { /** */ }
			}
		}
		// Write our pid to lock file
		fsSync.writeFileSync(lockPath, String(process.pid), { encoding: 'utf8' });
		const cleanup = () => { try { if (fsSync.existsSync(lockPath)) fsSync.unlinkSync(lockPath); } catch { /** */ } };
		process.on('exit', cleanup);
		process.on('SIGINT', () => { cleanup(); process.exit(0); });
		process.on('SIGTERM', () => { cleanup(); process.exit(0); });
	} catch (e) {
		logWarn('Failed to acquire single-instance lock, continuing startup', { error: (e as Error)?.message ?? e });
	}

	appInstance.start();
}