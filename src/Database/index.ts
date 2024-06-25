import { config } from 'dotenv';
import mongoose, { MongooseError } from 'mongoose';

config();

export const connectDatabase = async (): Promise<void> => {
	if (process.env.Enviroment === 'debug' || process.env.Enviroment === 'dev') {
		mongoose.set('debug', true); // Enable detailed logging (optional)
	} else {
		mongoose.set('debug', false);
	}

	const connectionString = process.env.MONGO_DATABASE_URI as string;

	try {
		await mongoose.connect(connectionString, { connectTimeoutMS: 10000 });

		console.log('MongoDB connection established successfully');

		// Use `mongoose.connection` directly for event listeners (more concise)
		mongoose.connection.on('connected', () => console.log('MongoDB connection re-established successfully'));
		mongoose.connection.on('error', (error: MongooseError) => {
			console.error('MongoDB connection error:', error.name, error.message, error.stack);
		});
		mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		process.exit(1); // Exit the process on failure (optional)
	}
};