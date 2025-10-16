import { info, warn, error as logError } from '../Utilities/logger';

interface ErrorContext {
	promise?: Promise<unknown>;
	origin?: NodeJS.UncaughtExceptionOrigin;
	signal?: NodeJS.Signals;
}

async function errorHandler(): Promise<void> {
	process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
		logError('Unhandled Rejection', { reason, promise: String(promise) });
		const context: ErrorContext = { promise };
		// also write an info entry
		await info('Unhandled Rejection observed', { reason: String(reason) });
	});

	process.on('uncaughtException', async (err: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
		logError('Uncaught Exception', { message: err.message, stack: err.stack, origin });
		const context: ErrorContext = { origin };
		await info('Process uncaught exception', { origin: context.origin });
	});

	process.on('warning', async (warning) => {
		warn('Process warning', { name: warning.name, message: warning.message, stack: warning.stack });
		await info('Process warning observed', { name: warning.name });
	});

	process.on('SIGINT', async () => {
		info('Received SIGINT. Exiting...');
		process.exit(0);
	});

	process.on('SIGTERM', async () => {
		info('Received SIGTERM. Exiting...');
		process.exit(0);
	});

	process.on('exit', async (code) => {
		info('Process exiting', { code });
	});

	process.on('multipleResolves', async (type, promise, reason) => {
		warn('Multiple resolves', { type, promise: String(promise), reason: String(reason) });
		await info('Multiple resolves detected', { type });
	});
}

export default errorHandler;