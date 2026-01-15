/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';

describe('TwitchAdapter', () => {
	beforeEach(() => {
		delete process.env.TWITCH_EVENTSUB_SECRET;
	});

	it('validates EventSub signature and normalizes stream.online event', async () => {
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

		const headers: Record<string, string> = {
			'twitch-eventsub-message-id': msgId,
			'twitch-eventsub-message-timestamp': timestamp,
			'twitch-eventsub-message-signature': signature,
			'twitch-eventsub-message-type': 'notification'
		};

		const { default: TwitchAdapter } = await import('../src/Integrations/twitchAdapter');

		expect(TwitchAdapter.validate).toBeDefined();
		const valid = await TwitchAdapter.validate!(headers as any, body as any);
		expect(valid).toBe(true);

		const normalized = await TwitchAdapter.normalize(headers as any, body as any);
		expect(normalized).not.toBeNull();
		expect(normalized?.provider).toBe('twitch');
		expect(normalized?.eventType).toBe('stream.online');
		expect(normalized?.id).toBe('sub-1');
		expect(normalized?.title).toBe('Super Cool Stream');
		expect(normalized?.url).toContain('coolstreamer');
	});
});
