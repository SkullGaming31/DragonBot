import mongoose, { MongooseError } from 'mongoose';
import { config } from 'dotenv';
config();

export const connectDatabase = async (): Promise<void> => {
	const connectionString = process.env.MONGO_DATABASE_URI as string;
	const Dev_ConnectionString = process.env.DEV_MONGO_DATABASE_URI as string;
	try {
		if (process.env.Environment === 'dev') {
			await mongoose.connect(`${Dev_ConnectionString}`, { connectTimeoutMS: 10000 });
		} else {
			await mongoose.connect(`${connectionString}`, { connectTimeoutMS: 10000 });
		}
		console.log('MongoDB connection established successfully');
		const { connection: DB } = mongoose;

		DB.on('connected', () => { console.log('MongoDB connection re-established successfully'); });

		DB.on('error', (error: MongooseError) => { console.error('MongoDB connection error:', error.name + '\n' + error.message + '\n' + error.stack); });

		DB.on('disconnected', () => { console.warn('MongoDB disconnected'); });
	} catch (error) {
		console.error('Error connecting to MongoDB', error);
	}
};