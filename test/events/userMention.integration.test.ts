import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { UserModel } from '../../src/Database/Schemas/userModel';
import userMentionEvent from '../../src/Events/customMessage/userMention';
import { startInMemoryMongo, stopInMemoryMongo } from '../helpers/mongoMemory';

beforeAll(async () => {
	await startInMemoryMongo();
});

afterAll(async () => {
	await stopInMemoryMongo();
});

describe('AFK message persistence', () => {
	it('clears only the returning user in the current guild without affecting their other data', async () => {
		await UserModel.create([
			{ guildID: 'afk-guild1', id: 'afk-user1', AFKmessage: 'Away', AFKstatus: 'idle', balance: 123 },
			{ guildID: 'afk-guild2', id: 'afk-user1', AFKmessage: 'Elsewhere', AFKstatus: 'dnd' },
			{ guildID: 'afk-guild1', id: 'afk-user2', AFKmessage: 'Busy', AFKstatus: 'idle' },
		]);
		const reply = vi.fn();
		const message = {
			inGuild: () => true,
			guild: { id: 'afk-guild1' },
			author: { id: 'afk-user1', bot: false },
			mentions: { users: { size: 0 } },
			reply,
		};

		await userMentionEvent.run(message as never);

		const current = await UserModel.findOne({ guildID: 'afk-guild1', id: 'afk-user1' }).lean();
		const otherGuild = await UserModel.findOne({ guildID: 'afk-guild2', id: 'afk-user1' }).lean();
		const otherUser = await UserModel.findOne({ guildID: 'afk-guild1', id: 'afk-user2' }).lean();
		expect(current).toMatchObject({ AFKmessage: '', AFKstatus: null, balance: 123 });
		expect(otherGuild).toMatchObject({ AFKmessage: 'Elsewhere', AFKstatus: 'dnd' });
		expect(otherUser).toMatchObject({ AFKmessage: 'Busy', AFKstatus: 'idle' });

		const mention = {
			...message,
			author: { id: 'afk-user3', bot: false },
			mentions: { users: { size: 1, first: () => ({ id: 'afk-user1', username: 'returning' }) } },
		};
		await userMentionEvent.run(mention as never);
		expect(reply).not.toHaveBeenCalled();
		expect(await UserModel.findOne({ guildID: 'afk-guild1', id: 'afk-user3' })).toBeNull();
	});
});
