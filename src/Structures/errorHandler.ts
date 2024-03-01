import * as fs from 'fs/promises'; // For file logging

interface ErrorContext {
	promise?: Promise<unknown>;
	origin?: NodeJS.UncaughtExceptionOrigin;
}

async function errorHandler(): Promise<void> {

	process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
		console.error('Unhandled Rejection:', reason, promise);
		const context: ErrorContext = { promise };

		// const errorMessage = `**Unhandled Rejection/Catch: \n\n** ${reason}\n\n${context.promise ? `Promise: ${context.promise}` : ''}\n`;

		// Optional: Log error to file
		await fs.appendFile('../dev logs/logs.log', `${Date.now()} | Unhandled Rejection: ${reason}\n${context.promise ? `Promise: ${context.promise}\n` : ''}\n\n`);
	});

	process.on('uncaughtException', async (err: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
		console.error(err, origin);

		const context: ErrorContext = { origin };
		// const errorMessage = `**Uncaught Exception/Catch: \n\n** ${err.stack}\n\nOrigin: ${context.origin ? context.origin.toString() : ''}\n`;

		// Optional: Log error to file
		await fs.appendFile('../dev logs/logs.log', `${Date.now()} | Uncaught Exception: ${err.message}\n${err.stack}\nOrigin: ${context.origin ? context.origin : ''}\n\n`);
	});

}

export default errorHandler;