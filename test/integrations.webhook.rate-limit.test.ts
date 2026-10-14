import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ExtendedClient } from '../src/Structures/Client';
import { createIntegrationRouter } from '../src/Integrations/webhookHandler';

describe('integration webhook rate limit', () => {
	afterEach(() => vi.unstubAllEnvs());

	it('rejects requests over the per-IP limit before handling the webhook', async () => {
		vi.stubEnv('INTEGRATIONS_SECRET', 'test-secret');

		const app = express();
		app.use(express.json());
		app.use('/integrations', createIntegrationRouter({} as ExtendedClient));

		for (let i = 0; i < 200; i += 1) {
			await request(app)
				.post('/integrations')
				.set('x-integration-secret', 'invalid')
				.send({})
				.expect(401);
		}

		await request(app)
			.post('/integrations')
			.set('x-integration-secret', 'invalid')
			.send({})
			.expect(429)
			.expect({ error: 'Too many requests, please try again later.' });
	});
});
