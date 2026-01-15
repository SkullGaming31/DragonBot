/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

describe('Integrations webhook handler - Twitch post', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.TWITCH_EVENTSUB_SECRET;
  });

  it('accepts a Twitch notification and posts to configured channel', async () => {
    process.env.TWITCH_EVENTSUB_SECRET = 'testsecret';

    const body = {
      subscription: { id: 'sub-1', type: 'stream.online' },
      event: {
        broadcaster_user_name: 'CoolStreamer',
        broadcaster_user_login: 'coolstreamer',
        title: 'Super Cool Stream'
      }
    };

    const msgId = 'msg-123';
    const timestamp = String(Date.now());
    const payload = JSON.stringify(body);
    const expected = crypto.createHmac('sha256', process.env.TWITCH_EVENTSUB_SECRET!).update(msgId + timestamp + payload).digest('hex');
    const signature = `sha256=${expected}`;

    // Mock IntegrationConfigModel.find().lean().exec() to return one enabled twitch config
    const fakeConfig = {
      GuildID: 'g1',
      provider: 'twitch',
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
      headers: {
        'twitch-eventsub-message-id': msgId,
        'twitch-eventsub-message-timestamp': timestamp,
        'twitch-eventsub-message-signature': signature,
        'twitch-eventsub-message-type': 'notification'
      },
      body
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await handleIntegrationWebhook(req, res);

    expect(json).toHaveBeenCalledWith({ status: 'accepted' });
    expect(sent.length).toBe(1);
    expect(sent[0]).toContain('Now streaming: Super Cool Stream');
  });
});
