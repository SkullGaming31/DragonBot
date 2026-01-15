/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Integrations webhook handler', () => {
	beforeEach(() => {
		vi.resetModules();
		delete process.env.INTEGRATIONS_SECRET;
	});

	it('returns 401 when secret is missing or mismatched', async () => {
		// Import handler without setting secret
		const { handleIntegrationWebhook } = await import('../src/Integrations/webhookHandler');

		const req: any = { headers: {}, body: {} };
		const json = vi.fn();
		const status = vi.fn(() => ({ json }));
		const res: any = { status };

		await handleIntegrationWebhook(req, res);

		expect(status).toHaveBeenCalledWith(401);
		expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
	});

	it('accepts a valid webhook and posts templated message to configured channels', async () => {
		process.env.INTEGRATIONS_SECRET = 'sup3rs3cr3tk3y';

		// Mock IntegrationConfigModel.find().lean().exec() to return one enabled config
		const fakeConfig = {
			GuildID: 'g1',
			provider: 'generic',
			enabled: true,
			channelId: 'chan-1',
			template: 'Now streaming: {{title}}'
		};

		const mockFind = vi.fn(() => ({ lean: () => ({ exec: async () => [fakeConfig] }) }));

		vi.doMock('../src/Database/Schemas/integrationConfig', () => ({ default: { find: mockFind } }));

		// Mock IntegrationEventModel to avoid touching real mongoose in tests
		const mockFindEvent = vi.fn(() => ({ lean: () => ({ exec: async () => null }) }));
		const mockCreateEvent = vi.fn(async (_: any) => ({}));
		vi.doMock('../src/Database/Schemas/integrationEvent', () => ({ default: { findOne: mockFindEvent, create: mockCreateEvent } }));

		// Mock appInstance.client.channels.fetch to return an object with send()
		const sent: string[] = [];
		const fakeChannel = { send: async (m: string) => { sent.push(m); return {}; } };

		vi.doMock('../src/index', () => ({ appInstance: { client: { channels: { fetch: async (id: string) => fakeChannel } } } }));

		const { handleIntegrationWebhook } = await import('../src/Integrations/webhookHandler');

		const req: any = {
			headers: { 'x-integration-secret': 'sup3rs3cr3tk3y', 'x-integration-source': 'generic' },
			body: { title: 'Cool Stream', url: 'https://twitch.tv/canadiendragon' }
		};

		const json = vi.fn();
		const status = vi.fn(() => ({ json }));
		const res: any = { status, json };

		await handleIntegrationWebhook(req, res);

		expect(json).toHaveBeenCalledWith({ status: 'accepted' });
		expect(sent.length).toBe(1);
		expect(sent[0]).toContain('Now streaming: Cool Stream');
	});
});
