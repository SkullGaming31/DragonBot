import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

export async function startInMemoryMongo() {
  // If a CI or external MongoDB URL is provided, connect to it instead of
  // attempting to download a binary (prevents CI download failures).
  // Prefer the in-memory server by default for local dev. Use external Mongo only when
  // running in CI (`CI=true`) or when explicitly opted in with `USE_LOCAL_MONGO=1`.
  const envExternal = process.env.MONGO_URL ?? process.env.MONGODB_URI ?? process.env.CI_MONGO_URL;
  const external = (process.env.CI === 'true' || process.env.USE_LOCAL_MONGO === '1') ? envExternal : undefined;
  if (external) {
    // Try to connect with retries — the CI mongo service may take a few seconds to be ready.
    // Keep total worst-case retry duration comfortably below Vitest hookTimeout (120s).
    const maxAttempts = 12; // ~96s worst-case with current timeouts
    const delayMs = 3000;
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // In CI the Mongo service is often available at the network alias 'mongo'
        // even when the workflow exposes MONGO_URL as mongodb://localhost:27017.
        // Prefer connecting to the service alias in CI to avoid ECONNREFUSED.
        const connectTarget = (process.env.CI === 'true' && /localhost|127\.0\.0\.1/.test(external))
          ? external.replace('localhost', 'mongo').replace('127.0.0.1', 'mongo')
          : external;
        if (process.env.CI === 'true') {
          // eslint-disable-next-line no-console
          console.log(`startInMemoryMongo: attempting connect to external Mongo (${connectTarget}), attempt ${attempt}/${maxAttempts}`);
        }
        await mongoose.connect(connectTarget, { serverSelectionTimeoutMS: 5000 });
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
        return connectTarget;
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
    if (process.env.CI === 'true') {
      // eslint-disable-next-line no-console
      console.error(`startInMemoryMongo: failed to connect to external Mongo after ${maxAttempts} attempts`);
    }
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
