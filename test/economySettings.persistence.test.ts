import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import EconomySettings from '../src/Database/Schemas/economySettings';
import { economyCommandDisabled, economyDisabled } from '../src/Utilities/economyCommands';

let server: MongoMemoryServer;

beforeAll(async () => {
	server = await MongoMemoryServer.create();
	await mongoose.connect(server.getUri());
});

afterAll(async () => {
	await mongoose.disconnect();
	if (server) await server.stop();
});

describe('shared economy settings persistence', () => {
	it('enforces persisted per-server dashboard settings without affecting other servers', async () => {
		await EconomySettings.collection.updateOne(
			{ guildId: 'guild-a' },
			{ $set: { enabled: false, disabledCommands: ['daily'] } },
			{ upsert: true }
		);
		expect(await economyDisabled('guild-a')).toBe(true);
		expect(await economyCommandDisabled('guild-a', 'work')).toBe(true);
		expect(await economyDisabled('guild-b')).toBe(false);
		expect(await economyCommandDisabled('guild-b', 'daily')).toBe(false);

		await EconomySettings.collection.updateOne({ guildId: 'guild-a' }, { $set: { enabled: true } });
		expect(await economyDisabled('guild-a')).toBe(false);
		expect(await economyCommandDisabled('guild-a', 'daily')).toBe(true);
		expect(await economyCommandDisabled('guild-a', 'work')).toBe(false);
	});
});
