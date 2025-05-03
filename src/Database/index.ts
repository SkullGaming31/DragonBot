import { config } from 'dotenv';
import mongoose, { Connection } from 'mongoose';

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
	mongoose.set('debug', isDev);

	// MongoDB connection URIs
	const uri = isDev ? process.env.MONGO_DEV_URI : process.env.MONGO_DATABASE_URI;

	if (!uri) {
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

		// Handle connection errors
		connection.on('error', (err) => {
			throw new MongoDBConnectionError(`MongoDB connection error: ${err}`);
		});
	} catch (error) {
		// Handle connection errors
		throw new MongoDBConnectionError(`Error connecting to MongoDB: ${error}`);
	}
};