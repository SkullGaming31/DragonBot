import { info, warn, error as logError } from '../Utilities/logger';

interface ErrorContext {
	promise?: Promise<unknown>;
	origin?: NodeJS.UncaughtExceptionOrigin;
	signal?: NodeJS.Signals | string;
}

/**
 * Register process-level handlers. If an optional `shutdown` callback is provided
 * it will be invoked for fatal signals so callers can perform graceful teardown.
 */
async function errorHandler(shutdown?: (signal: string) => Promise<void>): Promise<void> {
	// Allow tests or local development to disable exiting on fatal errors
	const shouldExitOnFatal = process.env.ERROR_HANDLER_EXIT_ON_FATAL !== 'false';
	process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
		logError('Unhandled Rejection', { reason, promise: String(promise) });
		const context: ErrorContext = { promise };
		await info('Unhandled Rejection observed', { reason: String(reason), contextUsed: Boolean(context.promise) });
		if (shouldExitOnFatal) {
			if (shutdown) {
				try {
					await shutdown('unhandledRejection');
				} catch (e) {
					console.error('Error while shutting down after unhandledRejection', e);
					process.exit(1);
				}
			} else {
				process.exit(1);
			}
		} else {
			// In non-exit mode just log and continue so tests can assert behavior
			info('Skipping process exit for unhandledRejection because ERROR_HANDLER_EXIT_ON_FATAL is false');
		}
	});

	process.on('uncaughtException', async (err: Error, origin: NodeJS.UncaughtExceptionOrigin) => {
		logError('Uncaught Exception', { message: err.message, stack: err.stack, origin });
		const context: ErrorContext = { origin };
		await info('Process uncaught exception', { origin: context.origin });
		if (shouldExitOnFatal) {
			if (shutdown) {
				try {
					await shutdown('uncaughtException');
				} catch (e) {
					console.error('Error while shutting down after uncaughtException', e);
					process.exit(1);
				}
			} else {
				process.exit(1);
			}
		} else {
			info('Skipping process exit for uncaughtException because ERROR_HANDLER_EXIT_ON_FATAL is false');
		}
	});

	process.on('warning', async (warning) => {
		warn('Process warning', { name: warning.name, message: warning.message, stack: warning.stack });
		await info('Process warning observed', { name: warning.name });
	});

	process.on('SIGINT', async () => {
		info('Received SIGINT');
		if (shouldExitOnFatal) {
			if (shutdown) {
				try {
					await shutdown('SIGINT');
				} catch (e) {
					console.error('Error while handling SIGINT', e);
					process.exit(1);
				}
			} else {
				info('Exiting due to SIGINT');
				process.exit(0);
			}
		} else {
			info('Ignoring SIGINT because ERROR_HANDLER_EXIT_ON_FATAL is false');
		}
	});

	process.on('SIGTERM', async () => {
		info('Received SIGTERM');
		if (shouldExitOnFatal) {
			if (shutdown) {
				try {
					await shutdown('SIGTERM');
				} catch (e) {
					console.error('Error while handling SIGTERM', e);
					process.exit(1);
				}
			} else {
				info('Exiting due to SIGTERM');
				process.exit(0);
			}
		} else {
			info('Ignoring SIGTERM because ERROR_HANDLER_EXIT_ON_FATAL is false');
		}
	});

	process.on('exit', async (code) => {
		info('Process exiting', { code });
	});

	// The `multipleResolves` event is deprecated in newer Node.js versions and
	// can emit noisy deprecation warnings. We rely on `unhandledRejection`
	// and `uncaughtException` for error handling and no longer listen for the
	// deprecated event to avoid deprecation noise.
}

export default errorHandler;