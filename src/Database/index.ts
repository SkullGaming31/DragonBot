import mongoose from 'mongoose';
import { config } from 'dotenv';
config();

// FIX: Mongo DB not connecting with this code, error with ip in database!
const connectDatabase = async () => {
	const connectionString = 'mongodb://127.0.0.1:27017';
	try {
		await mongoose.connect(`${connectionString}`, { connectTimeoutMS: 10000 });
		console.log('MongoDB connection established Successfully');
	} catch (error) {
		console.error('Error connecting to MongoDB', error);
	}
};

export default connectDatabase;