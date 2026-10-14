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
    const mockCreateEvent = vi.fn(async (_: any) => ({}));
    vi.doMock('../src/Database/Schemas/integrationEvent', () => ({ default: { create: mockCreateEvent } }));

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
    expect(mockCreateEvent).toHaveBeenCalledWith({ eventId: msgId, provider: 'twitch' });
    expect(sent.length).toBe(1);
    expect(sent[0]).toContain('Now streaming: Super Cool Stream');
  });

  it('returns a callback challenge only after validating its raw-body signature', async () => {
    process.env.TWITCH_EVENTSUB_SECRET = 'testsecret';

    const body = { challenge: 'challenge-value' };
    const rawBody = Buffer.from('{ "challenge" : "challenge-value" }');
    const msgId = 'verify-123';
    const timestamp = String(Date.now());
    const signature = crypto.createHmac('sha256', process.env.TWITCH_EVENTSUB_SECRET!)
      .update(msgId + timestamp)
      .update(rawBody)
      .digest('hex');
    const { handleIntegrationWebhook } = await import('../src/Integrations/webhookHandler');
    const send = vi.fn();
    const type = vi.fn(() => ({ send }));
    const json = vi.fn();
    const status = vi.fn(() => ({ type, json }));

    await handleIntegrationWebhook({
      headers: {
        'twitch-eventsub-message-id': msgId,
        'twitch-eventsub-message-timestamp': timestamp,
        'twitch-eventsub-message-signature': `sha256=${signature}`,
        'twitch-eventsub-message-type': 'webhook_callback_verification'
      },
      body,
      rawBody
    } as any, { status, type, send, json } as any, {} as any);

    expect(status).toHaveBeenCalledWith(200);
    expect(type).toHaveBeenCalledWith('text/plain');
    expect(send).toHaveBeenCalledWith('challenge-value');
  });

  it('rejects an unsigned callback challenge without echoing it', async () => {
    process.env.TWITCH_EVENTSUB_SECRET = 'testsecret';
    const { handleIntegrationWebhook } = await import('../src/Integrations/webhookHandler');
    const send = vi.fn();
    const type = vi.fn(() => ({ send }));
    const json = vi.fn();
    const status = vi.fn(() => ({ type, json }));

    await handleIntegrationWebhook({
      headers: {
        'twitch-eventsub-message-id': 'verify-456',
        'twitch-eventsub-message-timestamp': String(Date.now()),
        'twitch-eventsub-message-signature': 'sha256=00',
        'twitch-eventsub-message-type': 'webhook_callback_verification'
      },
      body: { challenge: 'challenge-value' },
      rawBody: Buffer.from('{"challenge":"challenge-value"}')
    } as any, { status, type, send, json } as any, {} as any);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    expect(send).not.toHaveBeenCalled();
  });
});
