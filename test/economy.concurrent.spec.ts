import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongoMemory';
import { UserModel } from '../src/Database/Schemas/userModel';

describe('Economy concurrency', () => {
  beforeAll(async () => {
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it('handles concurrent withdrawals without overdraft', async () => {
    // Create a user with balance 100
    await UserModel.create({ guildID: 'G1', id: 'U1', balance: 100, bank: 0 });

    // Simulate 10 concurrent withdraw attempts of 20 each from balance
    const attempts = Array.from({ length: 10 }, () =>
      UserModel.findOneAndUpdate({ guildID: 'G1', id: 'U1', balance: { $gte: 20 } }, { $inc: { balance: -20 } }, { new: true }).exec()
    );

    const results = await Promise.all(attempts);
    const successCount = results.filter(r => r).length;

    // Only 5 should succeed (5*20=100)
    expect(successCount).toBe(5);

    const final = await UserModel.findOne({ guildID: 'G1', id: 'U1' }).exec();
    expect(final?.balance).toBe(0);
  });
});
