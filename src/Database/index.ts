  import mongoose from 'mongoose';
  import { config } from 'dotenv';
  config();

  const connectDatabase = async () => {
    const connectionString = process.env.MONGO_DATABASE_URI;
    try {
      await mongoose.connect(`${connectionString}`, { connectTimeoutMS: 10000 });
      console.log('MongoDB connection established Successfully');
    } catch (error) {
      console.error('Error connecting to MongoDB', error)
    }
  };

  export default connectDatabase;