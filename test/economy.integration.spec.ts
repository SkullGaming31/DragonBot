import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongoMemory';
import { UserModel } from '../src/Database/Schemas/userModel';
import depositCmd from '../src/Commands/Fun/deposit';
import withdrawCmd from '../src/Commands/Fun/withdraw';

function makeInteraction(guildId: string, userId: string, amount: string) {
  return {
    guild: { id: guildId, channels: { cache: new Map() } },
    user: { id: userId },
    options: { getString: (k: string, r: boolean) => amount },
    channel: { id: 'C1' },
    reply: async (payload: any) => payload
  } as any;
}

describe('Economy integration', () => {
  beforeAll(async () => {
    await startInMemoryMongo();
  });

  afterAll(async () => {
    await stopInMemoryMongo();
  });

  it('deposit and withdraw flow', async () => {
    await UserModel.create({ guildID: 'G1', id: 'U1', balance: 100, bank: 0 });

    const i1 = makeInteraction('G1', 'U1', '50');
    await (depositCmd as any).run({ interaction: i1 });

    let u = await UserModel.findOne({ guildID: 'G1', id: 'U1' }).exec();
    expect(u?.balance).toBe(50);
    expect(u?.bank).toBe(50);

    const i2 = makeInteraction('G1', 'U1', 'all');
    await (withdrawCmd as any).run({ interaction: i2 });
    u = await UserModel.findOne({ guildID: 'G1', id: 'U1' }).exec();

    // bank was 50, withdraw all should bring bank to 0 and balance to 100
    expect(u?.bank).toBe(0);
    expect(u?.balance).toBe(100);
  });

  it('does not create an account when depositing without an existing funded account', async () => {
    const interaction = makeInteraction('G4', 'U4', '100000');

    const result = await (depositCmd as any).run({ interaction });

    expect(result).toMatchObject({
      content: 'Insufficient funds to deposit that amount.'
    });
    expect(await UserModel.findOne({ guildID: 'G4', id: 'U4' }).exec()).toBeNull();
  });

  it('does not create an account when withdrawing without an existing funded account', async () => {
    const interaction = makeInteraction('G5', 'U5', '100000');

    const result = await (withdrawCmd as any).run({ interaction });

    expect(result).toMatchObject({
      content: 'Insufficient funds in bank to withdraw that amount.'
    });
    expect(await UserModel.findOne({ guildID: 'G5', id: 'U5' }).exec()).toBeNull();
  });

  it('handles zero and negative amounts and invalid inputs for deposit', async () => {
    // Create a fresh user
    await UserModel.create({ guildID: 'G2', id: 'U2', balance: 100, bank: 0 });

    // zero deposit should be ignored / not change amounts
    const z = makeInteraction('G2', 'U2', '0');
    await (depositCmd as any).run({ interaction: z });
    let u = await UserModel.findOne({ guildID: 'G2', id: 'U2' }).exec();
    expect(u?.balance).toBe(100);
    expect(u?.bank).toBe(0);

    // negative deposit should be ignored
    const neg = makeInteraction('G2', 'U2', '-50');
    await (depositCmd as any).run({ interaction: neg });
    u = await UserModel.findOne({ guildID: 'G2', id: 'U2' }).exec();
    expect(u?.balance).toBe(100);
    expect(u?.bank).toBe(0);

    // invalid string should be ignored
    const bad = makeInteraction('G2', 'U2', 'notanumber');
    await (depositCmd as any).run({ interaction: bad });
    u = await UserModel.findOne({ guildID: 'G2', id: 'U2' }).exec();
    expect(u?.balance).toBe(100);
    expect(u?.bank).toBe(0);
  });

  it('handles zero and negative amounts and invalid inputs for withdraw including all behavior', async () => {
    // Create a fresh user
    await UserModel.create({ guildID: 'G3', id: 'U3', balance: 50, bank: 50 });

    // zero withdraw should do nothing
    const z = makeInteraction('G3', 'U3', '0');
    await (withdrawCmd as any).run({ interaction: z });
    let u = await UserModel.findOne({ guildID: 'G3', id: 'U3' }).exec();
    expect(u?.balance).toBe(50);
    expect(u?.bank).toBe(50);

    // negative withdraw should do nothing
    const neg = makeInteraction('G3', 'U3', '-10');
    await (withdrawCmd as any).run({ interaction: neg });
    u = await UserModel.findOne({ guildID: 'G3', id: 'U3' }).exec();
    expect(u?.balance).toBe(50);
    expect(u?.bank).toBe(50);

    // invalid string should do nothing
    const bad = makeInteraction('G3', 'U3', 'abc');
    await (withdrawCmd as any).run({ interaction: bad });
    u = await UserModel.findOne({ guildID: 'G3', id: 'U3' }).exec();
    expect(u?.balance).toBe(50);
    expect(u?.bank).toBe(50);

    // 'all' should move entire bank to balance
    const all = makeInteraction('G3', 'U3', 'all');
    await (withdrawCmd as any).run({ interaction: all });
    u = await UserModel.findOne({ guildID: 'G3', id: 'U3' }).exec();
    expect(u?.bank).toBe(0);
    expect(u?.balance).toBe(100);
  });
});
