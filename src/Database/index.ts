import { config } from 'dotenv';
import mongoose, { Connection } from 'mongoose';

config();

export const connectDatabase = async (): Promise<void> => {
	// Set mongoose debug mode based on environment
	const environment = process.env.Enviroment;
	const isDev = environment === 'dev' || environment === 'debug';
	mongoose.set('debug', isDev);

	// MongoDB connection URIs
	const devUri = 'mongodb://localhost:27017/dragonbot_dev';
	const prodUri = process.env.MONGO_DATABASE_URI as string;

	// Determine which URI to use
	const uri = isDev ? devUri : prodUri;

	try {
		// Attempt to connect to MongoDB
		await mongoose.connect(uri, { connectTimeoutMS: 10000 });

		// Cast mongoose.connection to Connection type
		const connection: Connection = mongoose.connection;

		/**
		 * Mongo readyState enums
		 * 0 = disconnected
		 * 1 = connected
		 * 2 = connecting
		 * 3 = disconnecting
		 * 99 = uninitialized
		 */
		switch (connection.readyState) {
			case 0:
				console.log('Disconnected from the database');
				break;
			case 1:
				console.log('Connected to the Mongo Database');
				break;
			case 2:
				console.log('Connecting to the Mongo Database');
				break;
			case 3:
				console.log('Disconnected from the Database');
				break;
			case 99:
				console.log('The Mongo Database is not initialized');
				break;
			default:
				break;
		}
	} catch (error) {
		// Handle connection errors
		console.error('Error connecting to MongoDB:', error);
		process.exit(1); // Exit the process on failure
	}
};