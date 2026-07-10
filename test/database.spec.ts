import { describe, it, expect, vi } from 'vitest';
import * as db from '../src/Database/index';

describe('Database connect', () => {
  it('throws when MONGO URI is not defined', async () => {
    const orig = process.env.MONGO_DATABASE_URI;
    const origMongo = process.env.MONGODB_URI;
    const origDev = process.env.MONGO_DEV_URI;
    const origEnv = process.env.Enviroment;
    // Force production behavior for this test so missing URI causes an error
    process.env.Enviroment = 'prod';
    process.env.MONGO_DATABASE_URI = '';
    process.env.MONGODB_URI = '';
    process.env.MONGO_DEV_URI = '';
    await expect(db.connectDatabase()).rejects.toThrow();
    process.env.MONGO_DATABASE_URI = orig;
    process.env.MONGODB_URI = origMongo;
    process.env.MONGO_DEV_URI = origDev;
    process.env.Enviroment = origEnv;
  });
});
