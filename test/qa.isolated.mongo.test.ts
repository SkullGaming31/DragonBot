import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongoMemory';
import { UserModel } from '../src/Database/Schemas/userModel';
import { ListingModel } from '../src/Database/Schemas/marketListing';
import IntegrationConfig from '../src/Database/Schemas/integrationConfig';
import IntegrationEvent from '../src/Database/Schemas/integrationEvent';
import market from '../src/Commands/Fun/market';
import daily from '../src/Commands/Fun/daily';
import SettingsModel from '../src/Database/Schemas/settingsDB';
import { handleIntegrationWebhook } from '../src/Integrations/webhookHandler';

vi.mock('../src/Utilities/logger', () => ({ error: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn() }));

describe('isolated QA regression tests', () => {
	beforeAll(async () => {
		vi.stubEnv('INTEGRATIONS_SECRET', 'qa-local-only');
		await startInMemoryMongo();
		await Promise.all([UserModel.init(), IntegrationEvent.init()]);
	});
	beforeEach(async () => {
		vi.restoreAllMocks();
		await Promise.all([UserModel.deleteMany({}), ListingModel.deleteMany({}), IntegrationConfig.deleteMany({}), IntegrationEvent.deleteMany({})]);
	});
	afterAll(async () => {
		await stopInMemoryMongo();
		vi.unstubAllEnvs();
	});

	function interaction(subcommand: string, guild: string, user: string, values: Record<string, string | number>) {
		return { guild: { id: guild }, user: { id: user }, options: {
			getSubcommand: () => subcommand, getString: (key: string) => values[key], getNumber: (key: string) => values[key],
		}, reply: vi.fn() };
	}

	it('escrows inventory, delivers items, and returns remaining stock on removal', async () => {
		await UserModel.create([{ guildID: 'A', id: 'seller', balance: 0, inventory: ['sword', 'shield', 'sword'] }, { guildID: 'A', id: 'buyer', balance: 100 }]);
		const create = interaction('create', 'A', 'seller', { item: 'sword', price: 40, quantity: 2 });
		await market.run({ interaction: create } as never);
		const listing = await ListingModel.findOne({ guildID: 'A' });
		expect(listing).toMatchObject({ escrowed: true, quantity: 2 });
		expect((await UserModel.findOne({ guildID: 'A', id: 'seller' }))?.inventory).toEqual(['shield']);
		const buy = interaction('buy', 'A', 'buyer', { id: String(listing!._id), quantity: 1 });
		await market.run({ interaction: buy } as never);
		expect(buy.reply.mock.calls[0][0].content).toContain('You bought');
		expect(await UserModel.findOne({ guildID: 'A', id: 'buyer' })).toMatchObject({ balance: 60, inventory: ['sword'] });
		expect(await UserModel.findOne({ guildID: 'A', id: 'seller' })).toMatchObject({ balance: 40, inventory: ['shield'] });
		const remove = interaction('remove', 'A', 'seller', { id: String(listing!._id) });
		await market.run({ interaction: remove } as never);
		expect((await UserModel.findOne({ guildID: 'A', id: 'seller' }))?.inventory).toEqual(['shield', 'sword']);
		expect(await ListingModel.findById(listing!._id)).toBeNull();
	});

	it('rejects unowned inventory and legacy or cross-guild listings', async () => {
		await UserModel.create([{ guildID: 'A', id: 'seller', inventory: [] }, { guildID: 'B', id: 'buyer', balance: 100 }]);
		const create = interaction('create', 'A', 'seller', { item: 'sword', price: 40, quantity: 1 });
		await market.run({ interaction: create } as never);
		expect(create.reply.mock.calls[0][0].content).toContain('do not own enough');
		const listing = await ListingModel.create({ guildID: 'A', sellerID: 'seller', itemName: 'sword', price: 40, quantity: 1 });
		for (const guild of ['A', 'B']) {
			const buy = interaction('buy', guild, 'buyer', { id: String(listing._id) });
			await market.run({ interaction: buy } as never);
			expect(buy.reply.mock.calls[0][0].content).toContain('Listing not found');
		}
		const crossRemove = interaction('remove', 'B', 'seller', { id: String(listing._id) });
		await market.run({ interaction: crossRemove } as never);
		expect(crossRemove.reply.mock.calls[0][0].content).toContain('Listing not found');
		expect(await ListingModel.findById(listing._id)).not.toBeNull();
		const remove = interaction('remove', 'A', 'seller', { id: String(listing._id) });
		await market.run({ interaction: remove } as never);
		expect(await ListingModel.findById(listing._id)).toBeNull();
		expect((await UserModel.findOne({ guildID: 'A', id: 'seller' }))?.inventory).toEqual([]);
	});

	it('rolls back a purchase when the buyer has insufficient funds', async () => {
		await UserModel.create([{ guildID: 'A', id: 'seller', inventory: ['sword'] }, { guildID: 'A', id: 'buyer', balance: 10 }]);
		await market.run({ interaction: interaction('create', 'A', 'seller', { item: 'sword', price: 40 }) } as never);
		const listing = await ListingModel.findOne({ guildID: 'A' });
		const buy = interaction('buy', 'A', 'buyer', { id: String(listing!._id) });
		await market.run({ interaction: buy } as never);
		expect(buy.reply.mock.calls[0][0].content).toContain('Insufficient funds');
		expect(await ListingModel.findById(listing!._id)).toMatchObject({ quantity: 1, active: true });
		expect(await UserModel.findOne({ guildID: 'A', id: 'buyer' })).toMatchObject({ balance: 10, inventory: [] });
	});

	it('allows only one buyer to purchase the final escrowed item', async () => {
		await UserModel.create([
			{ guildID: 'A', id: 'seller', inventory: ['sword'] },
			{ guildID: 'A', id: 'buyer1', balance: 100 },
			{ guildID: 'A', id: 'buyer2', balance: 100 },
		]);
		await market.run({ interaction: interaction('create', 'A', 'seller', { item: 'sword', price: 40 }) } as never);
		const listing = await ListingModel.findOne({ guildID: 'A' });
		const buyers = ['buyer1', 'buyer2'].map(id => interaction('buy', 'A', id, { id: String(listing!._id) }));
		await Promise.all(buyers.map(buyer => market.run({ interaction: buyer } as never)));
		expect(buyers.filter(buyer => buyer.reply.mock.calls[0][0].content.includes('You bought'))).toHaveLength(1);
		const accounts = await UserModel.find({ guildID: 'A', id: { $in: ['buyer1', 'buyer2'] } }).lean();
		expect(accounts.reduce((sum, account) => sum + account.balance, 0)).toBe(160);
		expect(accounts.flatMap(account => account.inventory)).toEqual(['sword']);
		expect((await UserModel.findOne({ guildID: 'A', id: 'seller' }))?.balance).toBe(40);
	});

	it('grants only one daily reward under concurrent claims, including account creation', async () => {
		vi.spyOn(SettingsModel, 'findOne').mockResolvedValue(null as never);
		vi.spyOn(Math, 'random').mockReturnValue(0);
		const a = { guild: { id: 'A' }, user: { id: 'buyer' }, reply: vi.fn() };
		const b = { guild: { id: 'A' }, user: { id: 'buyer' }, reply: vi.fn() };
		await Promise.all([daily.run({ interaction: a } as never), daily.run({ interaction: b } as never)]);
		const messages = [a.reply.mock.calls[0][0].content, b.reply.mock.calls[0][0].content];
		expect(messages.filter(message => message.includes('claimed your daily reward'))).toHaveLength(1);
		expect((await UserModel.findOne({ guildID: 'A', id: 'buyer' }))?.balance).toBe(100);
	});

	it('retries failed webhook destinations without resending successful ones', async () => {
		await IntegrationConfig.create([{ GuildID: 'A', provider: 'generic', channelId: 'one' }, { GuildID: 'B', provider: 'generic', channelId: 'two' }]);
		const sent: string[] = [];
		let fail = true;
		const client = { channels: { fetch: vi.fn(async (id: string) => ({
			async send(this: unknown) {
				expect(this).toBeDefined();
				if (sent.length === 1 && fail) throw new Error('delivery failed');
				sent.push(id);
			},
		})) } };
		const req = { headers: { 'x-integration-secret': 'qa-local-only' }, body: { id: 'event-1', title: 'test' } };
		const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
		await handleIntegrationWebhook(req as never, res as never, client as never);
		expect(res.status).toHaveBeenCalledWith(500);
		expect(sent).toHaveLength(1);
		const first = sent[0];
		fail = false;
		await handleIntegrationWebhook(req as never, res as never, client as never);
		expect(res.json).toHaveBeenLastCalledWith({ status: 'accepted' });
		expect(sent).toHaveLength(2);
		expect(new Set(sent)).toEqual(new Set(['one', 'two']));
		expect(sent.filter(id => id === first)).toHaveLength(1);
		await handleIntegrationWebhook(req as never, res as never, client as never);
		expect(res.json).toHaveBeenLastCalledWith({ status: 'duplicate' });
	});
});
