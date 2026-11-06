import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongod: MongoMemoryReplSet | null = null;

export async function startInMemoryMongo() {
  const replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  mongod = replset;
  const uri = replset.getUri();
  await mongoose.connect(uri);
  return uri;
}

export async function stopInMemoryMongo() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}
