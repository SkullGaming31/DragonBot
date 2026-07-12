import { config } from 'dotenv';
import mongoose, { Connection } from 'mongoose';
import { error as logError, warn as logWarn, info as logInfo } from '../Utilities/logger';

config();

export class MongoDBConnectionError extends Error {
	/**
	 * Constructor for MongoDBConnectionError.
	 * @param {string} message - The error message for the MongoDB connection error.
	 */
	constructor(message: string) {
		super(message);
		this.name = 'MongoDBConnectionError';
	}
}

/**
 * Establishes a connection to the MongoDB database.
 *
 * @remarks
 * Based on the value of the `ENVIRONMENT` environment variable, the function will
 * use either the `MONGO_DEV_URI` or `MONGO_DATABASE_URI` variable to connect to
 * the MongoDB database. If the `ENVIRONMENT` variable is neither 'dev' nor 'debug',
 * the function will use the `MONGO_DATABASE_URI` variable.
 *
 * The function will attempt to connect to the MongoDB database and log the
 * connection status to the console. If the connection is established successfully,
 * the function will log the message 'Connected to the Mongo Database' to the
 * console. If the connection cannot be established, the function will throw a
 * `MongoDBConnectionError` with a descriptive error message.
 *
 * @throws {MongoDBConnectionError} If the connection to the MongoDB database
 * cannot be established.
 */
export const connectDatabase = async (): Promise<void> => {
	// Set mongoose debug mode based on environment
	const isDev = process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug';
	mongoose.set('debug', false);

	// MongoDB connection URIs — support several common env var names for compatibility
	const uri = isDev
		? process.env.MONGO_DEV_URI ?? process.env.MONGO_DATABASE_URI ?? process.env.MONGODB_URI
		: process.env.MONGODB_URI ?? process.env.MONGO_DATABASE_URI ?? process.env.MONGO_DEV_URI;

	if (!uri) {
		// In development/debug mode, allow running without a database connection for convenience.
		if (isDev) {
			console.warn('MongoDB URI not configured — skipping database connection in dev mode');
			return;
		}
		throw new MongoDBConnectionError('MongoDB URI is not defined');
	}

	try {
		// Attempt to connect to MongoDB
		await mongoose.connect(uri, { connectTimeoutMS: 10000 });

		const connection: Connection = mongoose.connection;

		// Connection readyState mappings
		const connectionStates = {
			0: 'Disconnected from the database',
			1: 'Connected to the Mongo Database',
			2: 'Connecting to the Mongo Database',
			3: 'Disconnecting from the Database',
			99: 'Mongo Database is not initialized',
		};

		console.log(connectionStates[connection.readyState] || 'Unknown state');

		// Handle connection errors without throwing from the event handler.
		// Throwing inside an event handler can crash the process; instead log
		// and attempt a reconnect strategy.
		let reconnecting = false;
		const tryReconnect = async () => {
			if (reconnecting) return;
			reconnecting = true;
			const maxAttempts = 5;
			let attempt = 0;
			while (attempt < maxAttempts) {
				attempt += 1;
				const waitMs = 2000 * attempt; // linear backoff
				try {
					logInfo('Attempting MongoDB reconnect', { attempt });
					await mongoose.connect(uri, { connectTimeoutMS: 10000 });
					logInfo('MongoDB reconnect successful', { attempt });
					reconnecting = false;
					return;
				} catch (e) {
					logWarn('MongoDB reconnect attempt failed', { attempt, error: String(e) });
					await new Promise((r) => setTimeout(r, waitMs));
				}
			}
			logError('MongoDB reconnect failed after max attempts', { maxAttempts });
			reconnecting = false;
		};

		connection.on('error', (err) => {
			// Log the error and try to reconnect rather than throwing.
			logError('MongoDB connection error', { error: String(err) });
			void tryReconnect();
		});
	} catch (error) {
		// Handle connection errors
		throw new MongoDBConnectionError(`Error connecting to MongoDB: ${error}`);
	}
};