import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ListingModel } from '../src/Database/Schemas/marketListing';
import { UserModel } from '../src/Database/Schemas/userModel';
import marketCmd from '../src/Commands/Fun/market';

let replset: MongoMemoryReplSet;

beforeAll(async () => {
  replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replset.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replset) await replset.stop();
});

beforeEach(async () => {
  // clear collections
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeInteractionMock(partial: any) {
  // Minimal mock matching command.run signature ({ interaction })
  const reply = vi.fn();
  const interaction = Object.assign({ reply }, partial);
  return { interaction, reply };
}

describe('Marketplace commands', () => {
  it('creates a listing via market-create', async () => {
    const guildId = 'GUILD1';
    const userId = 'SELLER1';

    const opts = {
      guild: { id: guildId },
      user: { id: userId },
      options: {
        getString: (k: string, req?: boolean) => (k === 'item' ? 'Sword of Testing' : ''),
        getNumber: (k: string) => (k === 'price' ? 100 : k === 'quantity' ? 2 : undefined)
      }
    };

    // ensure subcommand is 'create' for the consolidated market command
    (opts.options as any).getSubcommand = () => 'create';
    const { interaction } = makeInteractionMock(opts);
    await (marketCmd as any).run({ interaction });

    const doc = await ListingModel.findOne({ guildID: guildId, sellerID: userId }).lean().exec();
    expect(doc).toBeTruthy();
    expect(doc!.itemName).toBe('Sword of Testing');
    expect(doc!.price).toBe(100);
    expect(doc!.quantity).toBe(2);
  });

  it('allows a user to buy a listing with transaction-safe updates', async () => {
    const guildId = 'GUILD2';
    const sellerId = 'SELLER2';
    const buyerId = 'BUYER2';

    // create seller and buyer
    await UserModel.create({ guildID: guildId, id: sellerId, username: 'seller', balance: 0 });
    await UserModel.create({ guildID: guildId, id: buyerId, username: 'buyer', balance: 1000 });

    const listing = await ListingModel.create({ guildID: guildId, sellerID: sellerId, itemName: 'Shield', price: 250, quantity: 3, active: true, createdAt: new Date() });

    const opts = {
      guild: { id: guildId },
      user: { id: buyerId },
      options: {
        getString: (k: string) => (k === 'id' ? String(listing._id) : ''),
        getNumber: (k: string) => (k === 'quantity' ? 1 : undefined)
      }
    };

    // set subcommand to 'buy'
    (opts.options as any).getSubcommand = () => 'buy';

    const { interaction } = makeInteractionMock(opts);
    await (marketCmd as any).run({ interaction });

    // verify post-conditions
    const updatedBuyer = await UserModel.findOne({ guildID: guildId, id: buyerId }).lean().exec();
    const updatedSeller = await UserModel.findOne({ guildID: guildId, id: sellerId }).lean().exec();
    const updatedListing = await ListingModel.findById(listing._id).lean().exec();

    expect(updatedBuyer).toBeTruthy();
    expect(updatedSeller).toBeTruthy();
    expect(updatedListing).toBeTruthy();

    expect((updatedBuyer as any).balance).toBe(750); // 1000 - 250
    expect((updatedSeller as any).balance).toBe(250);
    expect((updatedListing as any).quantity).toBe(2);
  });

  it('lists active listings via market-list', async () => {
    const guildId = 'GUILD3';
    // create two listings
    await ListingModel.create({ guildID: guildId, sellerID: 'S1', itemName: 'Potion', price: 10, quantity: 5, active: true, createdAt: new Date() });
    await ListingModel.create({ guildID: guildId, sellerID: 'S2', itemName: 'Herb', price: 5, quantity: 3, active: true, createdAt: new Date() });

    const opts = {
      guild: { id: guildId },
      user: { id: 'ANY' },
      options: {
        getString: (k: string) => undefined
      }
    };

    // set subcommand to 'list' and call consolidated market command
    (opts.options as any).getSubcommand = () => 'list';
    const { interaction, reply } = makeInteractionMock(opts);
    await (marketCmd as any).run({ interaction } as any);

    expect(reply).toHaveBeenCalled();
    const arg = reply.mock.calls[0][0];
    expect(arg).toBeTruthy();
    expect(arg.embeds).toBeTruthy();
    // embed should include fields for each listing
    const embed = arg.embeds[0];
    expect(embed.data).toBeTruthy();
    expect(embed.data.title).toMatch(/Marketplace Listings/);
  });

  it('allows seller to remove a listing and blocks non-seller', async () => {
    const guildId = 'GUILD4';
    const seller = 'SELLER_REMOVE';
    const other = 'NOT_SELLER';

    const listing = await ListingModel.create({ guildID: guildId, sellerID: seller, itemName: 'Axe', price: 50, quantity: 1, active: true, createdAt: new Date() });

    // attempt remove by non-seller
    let opts = { guild: { id: guildId }, user: { id: other }, options: { getString: (k: string) => String(listing._id) } };
    // legacy tests expect the old module; use consolidated market 'remove' subcommand
    (opts.options as any).getSubcommand = () => 'remove';
    let mock = makeInteractionMock(opts);
    await (marketCmd as any).run({ interaction: mock.interaction } as any);
    expect(mock.reply).toHaveBeenCalled();
    expect((mock.reply.mock.calls[0][0] as any).content).toMatch(/Only the seller/);

    // remove by seller
    opts = { guild: { id: guildId }, user: { id: seller }, options: { getString: (k: string) => String(listing._id) } };
    (opts.options as any).getSubcommand = () => 'remove';
    mock = makeInteractionMock(opts);
    await (marketCmd as any).run({ interaction: mock.interaction } as any);
    expect(mock.reply).toHaveBeenCalled();
    expect((mock.reply.mock.calls[0][0] as any).content).toMatch(/removed/);

    const found = await ListingModel.findById(listing._id).lean().exec();
    expect(found).toBeNull();
  });
});
