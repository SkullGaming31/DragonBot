import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	connect: vi.fn().mockResolvedValue(undefined),
	disconnect: vi.fn().mockResolvedValue(undefined),
	stop: vi.fn().mockResolvedValue(undefined),
	create: vi.fn(),
}));
vi.mock('mongoose', () => ({ default: { connect: mocks.connect, disconnect: mocks.disconnect } }));
vi.mock('mongodb-memory-server', () => ({ MongoMemoryReplSet: { create: mocks.create } }));

import { startInMemoryMongo, stopInMemoryMongo } from './mongoMemory';

describe('isolated MongoDB helper', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it('ignores external URI settings even when CI and local MongoDB are enabled', async () => {
		vi.stubEnv('CI', 'true');
		vi.stubEnv('USE_LOCAL_MONGO', '1');
		vi.stubEnv('MONGO_URL', 'mongodb://external.invalid/should-not-be-used');
		mocks.create.mockResolvedValue({ getUri: () => 'mongodb://isolated.invalid/test', stop: mocks.stop });

		await startInMemoryMongo();
		await stopInMemoryMongo();

		expect(mocks.connect).toHaveBeenCalledWith('mongodb://isolated.invalid/test');
		expect(mocks.stop).toHaveBeenCalledOnce();
	});
});
