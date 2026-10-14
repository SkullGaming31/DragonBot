import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/Database/Schemas/settingsDB', () => ({
	default: { findOne: vi.fn(async () => null) }
}));

vi.mock('../src/Database/Schemas/userModel', () => ({
	UserModel: { findOneAndUpdate: vi.fn(async () => ({ balance: 9000 })) }
}));

vi.mock('../src/Utilities/logger', () => ({
	error: vi.fn(),
	warn: vi.fn()
}));

vi.mock('../src/Utilities/retry', () => ({
	tryReact: vi.fn(async () => undefined)
}));

import { UserModel } from '../src/Database/Schemas/userModel';
import heistCommand from '../src/Commands/Fun/heist';

type CollectorHandler = (...args: any[]) => Promise<void> | void;

async function startHeist() {
	const handlers = new Map<string, CollectorHandler>();
	const collector = {
		on: vi.fn((event: string, handler: CollectorHandler) => {
			handlers.set(event, handler);
			return collector;
		})
	};
	const channel = {
		id: 'channel1',
		send: vi.fn(async () => ({ id: 'message1' })),
		bulkDelete: vi.fn(async () => undefined)
	};
	const heistMessage = {
		fetch: vi.fn(async () => ({
			createReactionCollector: vi.fn(() => collector)
		})),
		reactions: { removeAll: vi.fn(async () => undefined) }
	};
	const interaction = {
		deferReply: vi.fn(async () => undefined),
		editReply: vi.fn(async () => heistMessage),
		options: { getNumber: vi.fn(() => 1000) },
		user: { id: 'host', username: 'Host' },
		guild: { id: 'guild1', channels: { cache: new Map() } },
		channel
	};

	await (heistCommand as any).run({ interaction });
	return { handlers, channel, heistMessage };
}

describe('heist stake refunds', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv('ENVIRONMENT', 'prod');
	});

	afterEach(() => vi.unstubAllEnvs());

	it('refunds the stake when the collector ends without enough participants', async () => {
		const { handlers } = await startHeist();

		await handlers.get('end')?.([], 'time');

		expect(UserModel.findOneAndUpdate).toHaveBeenNthCalledWith(
			2,
			{ guildID: 'guild1', id: 'host' },
			{ $inc: { balance: 1000 } },
			{ new: true }
		);
	});

	it('refunds only once when the last participant leaves and the collector ends', async () => {
		const { handlers, channel, heistMessage } = await startHeist();
		const reaction = { emoji: { name: '✅' }, message: { channel, reactions: heistMessage.reactions } };
		const participant = { id: 'joiner', username: 'Joiner', bot: false };

		await handlers.get('collect')?.(reaction, participant);
		await handlers.get('remove')?.(reaction, participant);
		await handlers.get('end')?.([], 'time');

		expect(UserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
		expect(UserModel.findOneAndUpdate).toHaveBeenNthCalledWith(
			2,
			{ guildID: 'guild1', id: 'host' },
			{ $inc: { balance: 1000 } },
			{ new: true }
		);
	});
});
