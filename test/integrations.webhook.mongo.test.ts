import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startInMemoryMongo, stopInMemoryMongo } from './helpers/mongoMemory';
import IntegrationConfig from '../src/Database/Schemas/integrationConfig';
import IntegrationEvent from '../src/Database/Schemas/integrationEvent';
import { createIntegrationRouter } from '../src/Integrations/webhookHandler';

vi.mock('../src/Utilities/logger', () => ({ error: vi.fn(), debug: vi.fn() }));

describe('webhook persistence integration', () => {
	const send = vi.fn().mockResolvedValue(undefined);
	const fetch = vi.fn().mockResolvedValue({ send });
	const app = express();
	app.use(express.json());
	app.use('/integrations', createIntegrationRouter({ channels: { fetch } } as never));

	beforeAll(async () => {
		vi.stubEnv('INTEGRATIONS_SECRET', 'isolated-test-secret');
		await startInMemoryMongo();
		await IntegrationEvent.init();
	});
	beforeEach(async () => {
		vi.clearAllMocks();
		await IntegrationConfig.deleteMany({});
		await IntegrationEvent.deleteMany({});
		await IntegrationConfig.create({ GuildID: 'guild', provider: 'generic', channelId: 'channel', template: '{{title}}: {{url}}' });
	});
	afterAll(async () => {
		await stopInMemoryMongo();
		vi.unstubAllEnvs();
	});

	it('atomically accepts one of two concurrent deliveries and posts once', async () => {
		const post = () => request(app).post('/integrations')
			.set('x-integration-secret', 'isolated-test-secret')
			.send({ id: 'event-1', title: 'Stream', url: 'https://example.invalid' });
		const results = await Promise.all([post(), post()]);
		expect(results.filter(r => r.status === 200)).toHaveLength(1);
		expect([202, 503]).toContain(results.find(r => r.status !== 200)?.status);
		expect(results.find(r => r.status === 200)?.body.status).toBe('accepted');
		expect(await IntegrationEvent.countDocuments({ eventId: 'event-1' })).toBe(1);
		expect(send).toHaveBeenCalledExactlyOnceWith('Stream: https://example.invalid');
	});

	it('does not claim or deliver an unauthorized request', async () => {
		await request(app).post('/integrations').set('x-integration-secret', 'wrong')
			.send({ id: 'event-2', title: 'Stream' }).expect(401);
		expect(await IntegrationEvent.countDocuments()).toBe(0);
		expect(fetch).not.toHaveBeenCalled();
	});
});
