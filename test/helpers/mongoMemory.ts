import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongo() {
  // If a CI or external MongoDB URL is provided, connect to it instead of
  // attempting to download a binary (prevents CI download failures).
  const external = process.env.MONGO_URL ?? process.env.MONGODB_URI ?? process.env.CI_MONGO_URL;
  if (external) {
    // Try to connect with retries — the CI mongo service may take a few seconds to be ready.
    const maxAttempts = 12; // ~60s total with 5s delay
    const delayMs = 5000;
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (process.env.CI === 'true') {
          // eslint-disable-next-line no-console
          console.log(`startInMemoryMongo: attempting connect to external Mongo (${external}), attempt ${attempt}/${maxAttempts}`);
        }
        await mongoose.connect(external, { serverSelectionTimeoutMS: 5000 });
        // If we're using an external Mongo (CI service or local dev), ensure
        // the test database is clean. Only drop when it's clearly a safe
        // target: CI environment or localhost/127.0.0.1 to avoid harming
        // accidental production connections.
        const isLocal = /localhost|127\.0\.0\.1/.test(external);
        if (process.env.CI === 'true' || isLocal) {
          const db = mongoose.connection.db;
          if (db) {
            if (process.env.CI === 'true') {
              // eslint-disable-next-line no-console
              console.log('startInMemoryMongo: dropping external test database');
            }
            // eslint-disable-next-line no-await-in-loop
            await db.dropDatabase();
          }
        }
        return external;
      } catch (err) {
        lastErr = err;
        if (process.env.CI === 'true') {
          // eslint-disable-next-line no-console
          console.warn(`startInMemoryMongo: connect attempt ${attempt} failed: ${String(err)}`);
        }
        // wait before retrying
        // eslint-disable-next-line no-await-in-loop
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
    // If we exit the loop, throw the last error so test harness fails with a helpful message
    throw new Error(`Failed to connect to external MongoDB at ${external}: ${String(lastErr)}`);
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
