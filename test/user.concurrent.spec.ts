import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongoMemory';
import { UserModel } from '../src/Database/Schemas/userModel';

describe('UserModel concurrent creation', () => {
  beforeAll(async () => {
    await startInMemoryMongo();
    // Ensure indexes are created before running concurrent operations
    await UserModel.createIndexes();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it('should not create duplicate user documents under concurrent creation', async () => {
    const guildID = 'guild-1';
    const userID = 'user-1';

    // Make many concurrent attempts to create the same user
    const tasks = Array.from({ length: 20 }).map(() =>
      (async () => {
        try {
          const doc = new UserModel({ guildID, id: userID, username: 'concurrent', balance: 0 });
          await doc.save();
          return { ok: true };
        } catch (err: unknown) {
          // Expect some duplicate key errors; swallow and return failure marker
          return { ok: false, err };
        }
      })()
    );

    const results = await Promise.all(tasks);

    // Confirm at least one succeeded
    expect(results.some(r => r.ok)).toBe(true);

    // There should be exactly one document in the collection matching guildID+id
    const found = await UserModel.find({ guildID, id: userID }).lean().exec();
    expect(found.length).toBe(1);
  });
});
