import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongo() {
  // If a CI or external MongoDB URL is provided, connect to it instead of
  // attempting to download a binary (prevents CI download failures).
  const external = process.env.MONGO_URL ?? process.env.MONGODB_URI ?? process.env.CI_MONGO_URL;
  if (external) {
    await mongoose.connect(external);
    return external;
  }

  mongod = await MongoMemoryServer.create({ instance: { storageEngine: 'wiredTiger' } });
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  return uri;
}

export async function stopInMemoryMongo() {
  await mongoose.disconnect();
  // Only stop the in-memory server if we started it here
  if (mongod) await mongod.stop();
}
