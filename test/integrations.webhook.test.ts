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
		const mockCreateEvent = vi.fn(async (_: any) => ({}));
		vi.doMock('../src/Database/Schemas/integrationEvent', () => ({ default: { create: mockCreateEvent } }));

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
		expect(mockCreateEvent).toHaveBeenCalledWith({ eventId: expect.any(String), provider: 'generic' });
		expect(sent.length).toBe(1);
		expect(sent[0]).toContain('Now streaming: Cool Stream');
	});

	it('returns duplicate when the atomic event claim hits a duplicate key', async () => {
		process.env.INTEGRATIONS_SECRET = 'sup3rs3cr3tk3y';

		const duplicateKeyError = Object.assign(new Error('duplicate key'), { code: 11000 });
		const mockCreateEvent = vi.fn().mockRejectedValue(duplicateKeyError);
		const mockFindConfig = vi.fn();
		vi.doMock('../src/Database/Schemas/integrationConfig', () => ({ default: { find: mockFindConfig } }));
		vi.doMock('../src/Database/Schemas/integrationEvent', () => ({ default: { create: mockCreateEvent } }));
		vi.doMock('../src/index', () => ({ appInstance: { client: { channels: { fetch: vi.fn() } } } }));

		const { handleIntegrationWebhook } = await import('../src/Integrations/webhookHandler');
		const req: any = {
			headers: { 'x-integration-secret': 'sup3rs3cr3tk3y', 'x-integration-source': 'generic' },
			body: { id: 'event-1', title: 'Cool Stream' }
		};
		const json = vi.fn();
		const status = vi.fn(() => ({ json }));

		await handleIntegrationWebhook(req, { status, json } as any);

		expect(status).toHaveBeenCalledWith(202);
		expect(json).toHaveBeenCalledWith({ status: 'duplicate' });
		expect(mockCreateEvent).toHaveBeenCalledWith({ eventId: 'event-1', provider: 'generic' });
		expect(mockFindConfig).not.toHaveBeenCalled();
	});

	it('returns an error instead of sending when the event claim fails for another reason', async () => {
		process.env.INTEGRATIONS_SECRET = 'sup3rs3cr3tk3y';

		const mockCreateEvent = vi.fn().mockRejectedValue(new Error('database unavailable'));
		const mockFindConfig = vi.fn();
		vi.doMock('../src/Database/Schemas/integrationConfig', () => ({ default: { find: mockFindConfig } }));
		vi.doMock('../src/Database/Schemas/integrationEvent', () => ({ default: { create: mockCreateEvent } }));
		vi.doMock('../src/index', () => ({ appInstance: { client: { channels: { fetch: vi.fn() } } } }));

		const { handleIntegrationWebhook } = await import('../src/Integrations/webhookHandler');
		const req: any = {
			headers: { 'x-integration-secret': 'sup3rs3cr3tk3y', 'x-integration-source': 'generic' },
			body: { id: 'event-2', title: 'Cool Stream' }
		};
		const json = vi.fn();
		const status = vi.fn(() => ({ json }));

		await handleIntegrationWebhook(req, { status, json } as any);

		expect(status).toHaveBeenCalledWith(500);
		expect(json).toHaveBeenCalledWith({ error: 'internal error' });
		expect(mockFindConfig).not.toHaveBeenCalled();
	});
});
