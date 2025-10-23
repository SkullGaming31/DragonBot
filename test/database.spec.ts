import { describe, it, expect, vi } from 'vitest';
import * as db from '../src/Database/index';

describe('Database connect', () => {
  it('throws when MONGO URI is not defined', async () => {
    const orig = process.env.MONGO_DATABASE_URI;
    process.env.MONGO_DATABASE_URI = '';
    await expect(db.connectDatabase()).rejects.toThrow();
    process.env.MONGO_DATABASE_URI = orig;
  });
});
