import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongoMemory';
import { UserModel } from '../src/Database/Schemas/userModel';

beforeAll(async () => {
  await startInMemoryMongo();
});

afterAll(async () => {
  await stopInMemoryMongo();
});

beforeEach(async () => {
  // clear collections
  const collections = (await import('mongoose')).default.connection.collections;
  for (const key of Object.keys(collections)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (collections as any)[key].deleteMany({});
  }
});

describe('UserModel hooks', () => {
  it('pre-save floors fractional balance and bank', async () => {
    const u = new UserModel({ guildID: 'G1', id: 'U1', username: 'u', balance: 123.9, bank: 45.7 });
    await u.save();
    const found = await UserModel.findOne({ guildID: 'G1', id: 'U1' }).lean().exec();
    expect(found).toBeTruthy();
    expect(found!.balance).toBe(123);
    expect(found!.bank).toBe(45);
  });

  it('post findOneAndUpdate rounds fractional values and persists', async () => {
    await UserModel.create({ guildID: 'G2', id: 'U2', username: 'u2', balance: 10, bank: 5 });
    // Use findOneAndUpdate to set fractional values
    const updated = await UserModel.findOneAndUpdate({ guildID: 'G2', id: 'U2' }, { $set: { balance: 77.9, bank: 3.4 } }, { new: true }).exec();
    // wait a tick to allow post hook persistence to complete
    await new Promise((r) => setTimeout(r, 50));
    const reloaded = await UserModel.findOne({ guildID: 'G2', id: 'U2' }).lean().exec();
    expect(reloaded).toBeTruthy();
    expect(reloaded!.balance).toBe(77);
    expect(reloaded!.bank).toBe(3);
  });
});
