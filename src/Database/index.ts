// import { config } from 'dotenv';
// import mongoose, { Connection } from 'mongoose';

// config();

// export const connectDatabase = async (): Promise<void> => {
// 	// Set mongoose debug mode based on environment
// 	const isDev = process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'debug';
// 	mongoose.set('debug', isDev);

// 	// MongoDB connection URIs
// 	const uri = isDev ? process.env.MONGO_DEV_URI : process.env.MONGO_DATABASE_URI;

// 	if (!uri) {
// 		throw new Error('MongoDB URI is not defined');
// 	}

// 	try {
// 		// Attempt to connect to MongoDB
// 		await mongoose.connect(uri, { connectTimeoutMS: 10000 });

// 		const connection: Connection = mongoose.connection;

// 		// Connection readyState mappings
// 		const connectionStates = {
// 			0: 'Disconnected from the database',
// 			1: 'Connected to the Mongo Database',
// 			2: 'Connecting to the Mongo Database',
// 			3: 'Disconnecting from the Database',
// 			99: 'Mongo Database is not initialized',
// 		};

// 		console.log(connectionStates[connection.readyState] || 'Unknown state');

// 		// Handle connection errors
// 		connection.on('error', (err) => {
// 			console.error('MongoDB connection error:', err);
// 		});
// 	} catch (error) {
// 		// Handle connection errors
// 		console.error('Error connecting to MongoDB:', error);
// 	}
// };
import { config } from 'dotenv';
import mongoose, { Connection } from 'mongoose';

config();

export class MongoDBConnectionError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'MongoDBConnectionError';
	}
}

export const connectDatabase = async (): Promise<void> => {
	// Set mongoose debug mode based on environment
	const isDev = process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'debug';
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