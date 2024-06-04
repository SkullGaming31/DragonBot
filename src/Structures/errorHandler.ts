import * as fs from 'fs/promises'; // For file logging

interface ErrorContext {
	promise?: Promise<unknown>;
	origin?: NodeJS.UncaughtExceptionOrigin;
	signal?: NodeJS.Signals;
}

async function logToFile(message: string): Promise<void> {
	if (process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'debug') {
		return; // Skip logging in dev or debug environments
	}

	try {
		await fs.appendFile('../devLogs/logs.log', message);
	} catch (err) {
		console.error('Failed to write to log file:', err);
	}
}

async function errorHandler(): Promise<void> {
	process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
		console.error('Unhandled Rejection:', reason, promise);
		const context: ErrorContext = { promise };

		// Optional: Log error to file
		await logToFile(`${Date.now()} | Unhandled Rejection: ${reason}\n${context.promise ? `Promise: ${context.promise}\n` : ''}\n\n`);
	});

	process.on('uncaughtException', async (err: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
		console.error(err, origin);

		const context: ErrorContext = { origin };
		// Optional: Log error to file
		await logToFile(`${Date.now()} | Uncaught Exception: ${err.message}\n${err.stack}\nOrigin: ${context.origin ? context.origin : ''}\n\n`);
	});

	process.on('warning', async (warning) => {
		console.warn('Warning:', warning);
		// Optional: Log warning to file
		await logToFile(`${Date.now()} | Warning: ${warning.name}\n${warning.message}\n${warning.stack}\n\n`);
	});

	process.on('SIGINT', async () => {
		console.log('Received SIGINT. Exiting...');
		// Optional: Log to file
		await logToFile(`${Date.now()} | Received SIGINT. Exiting...\n\n`);
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		console.log('Received SIGTERM. Exiting...');
		// Optional: Log to file
		await logToFile(`${Date.now()} | Received SIGTERM. Exiting...\n\n`);
		process.exit(0);
	});

	process.on('exit', async (code) => {
		console.log('Process exiting with code:', code);
		// Optional: Log to file
		await logToFile(`${Date.now()} | Process exiting with code: ${code}\n\n`);
	});

	process.on('multipleResolves', async (type, promise, reason) => {
		console.warn('Multiple Resolves:', type, promise, reason);
		// Optional: Log to file
		await logToFile(`${Date.now()} | Multiple Resolves: ${type}\nPromise: ${promise}\nReason: ${reason}\n\n`);
	});
}

export default errorHandler;