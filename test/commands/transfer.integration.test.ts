import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageFlags } from 'discord.js';
import transfer from '../../src/Commands/Fun/transfer';
import { UserModel } from '../../src/Database/Schemas/userModel';
import { startInMemoryMongo, stopInMemoryMongo } from '../helpers/mongoMemory';

function makeInteraction(amount: string, target = 'recipient') {
	return {
		guild: { id: 'guild' },
		user: { id: 'sender' },
		options: { getString: (name: string) => name === 'user' ? target : amount },
		reply: vi.fn().mockResolvedValue(undefined),
	};
}

describe('transfer transactions', () => {
	beforeAll(async () => {
		await startInMemoryMongo();
		await UserModel.init();
	});
	beforeEach(async () => {
		await UserModel.deleteMany({});
		await UserModel.create({ guildID: 'guild', id: 'sender', balance: 100 });
	});
	afterEach(() => vi.restoreAllMocks());
	afterAll(async () => {
		await stopInMemoryMongo();
		vi.unstubAllEnvs();
	});

	it('commits both sides and creates the recipient account', async () => {
		const i = makeInteraction('25.9');
		await transfer.run({ interaction: i } as never);
		expect(i.reply).toHaveBeenCalledWith({ content: 'Transferred 25 gold to <@recipient>.' });
		expect((await UserModel.findOne({ guildID: 'guild', id: 'sender' }))?.balance).toBe(75);
		expect((await UserModel.findOne({ guildID: 'guild', id: 'recipient' }))?.balance).toBe(25);
	});

	it('transfers all of the current balance', async () => {
		const i = makeInteraction('ALL');
		await transfer.run({ interaction: i } as never);
		expect((await UserModel.findOne({ guildID: 'guild', id: 'sender' }))?.balance).toBe(0);
		expect((await UserModel.findOne({ guildID: 'guild', id: 'recipient' }))?.balance).toBe(100);
	});

	it('does not create a recipient when funds are insufficient', async () => {
		const i = makeInteraction('101');
		await transfer.run({ interaction: i } as never);
		expect(i.reply).toHaveBeenCalledWith({ content: 'Insufficient funds.', flags: MessageFlags.Ephemeral });
		expect((await UserModel.findOne({ guildID: 'guild', id: 'sender' }))?.balance).toBe(100);
		expect(await UserModel.findOne({ guildID: 'guild', id: 'recipient' })).toBeNull();
	});

	it('rolls back the debit if the recipient update fails', async () => {
		const original = UserModel.findOneAndUpdate.bind(UserModel);
		vi.spyOn(UserModel, 'findOneAndUpdate').mockImplementation(((filter: any, ...args: any[]) => {
			if (filter.id === 'recipient') return { exec: () => Promise.reject(new Error('write failed')) };
			return (original as any)(filter, ...args);
		}) as any);
		const i = makeInteraction('25');
		await transfer.run({ interaction: i } as never);
		expect(i.reply).toHaveBeenCalledWith({ content: 'Transfer failed, please try again later.', flags: MessageFlags.Ephemeral });
		expect((await UserModel.findOne({ guildID: 'guild', id: 'sender' }))?.balance).toBe(100);
		expect(await UserModel.findOne({ guildID: 'guild', id: 'recipient' })).toBeNull();
	});

	it.each(['0', '-1', 'invalid'])('rejects invalid amount %s without modifying balances', async (amount) => {
		const i = makeInteraction(amount);
		await transfer.run({ interaction: i } as never);
		expect(i.reply).toHaveBeenCalledWith({ content: 'Please provide a valid amount greater than 0.', flags: MessageFlags.Ephemeral });
		expect((await UserModel.findOne({ guildID: 'guild', id: 'sender' }))?.balance).toBe(100);
		expect(await UserModel.findOne({ guildID: 'guild', id: 'recipient' })).toBeNull();
	});

	it('rejects self-transfers', async () => {
		const i = makeInteraction('25', 'sender');
		await transfer.run({ interaction: i } as never);
		expect(i.reply).toHaveBeenCalledWith({ content: 'You cannot transfer to yourself.', flags: MessageFlags.Ephemeral });
		expect((await UserModel.findOne({ guildID: 'guild', id: 'sender' }))?.balance).toBe(100);
	});
});
