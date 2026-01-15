import crypto from 'crypto';
import { IntegrationAdapter, NormalizedEvent } from './adapter';

const HEADER_SIGNATURE = 'twitch-eventsub-message-signature';
const HEADER_ID = 'twitch-eventsub-message-id';
const HEADER_TIMESTAMP = 'twitch-eventsub-message-timestamp';
const HEADER_TYPE = 'twitch-eventsub-message-type';

function getHeaderValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
	const raw = headers[name] ?? headers[name.toLowerCase() as keyof typeof headers];
	if (Array.isArray(raw)) return raw[0];
	return raw as string | undefined;
}

export const TwitchAdapter: IntegrationAdapter = {
	validate(headers: Record<string, string | string[] | undefined>, body: unknown): boolean {
		const secret = process.env.TWITCH_EVENTSUB_SECRET ?? '';
		if (!secret) return false;

		const sigHeader = getHeaderValue(headers, HEADER_SIGNATURE);
		const msgId = getHeaderValue(headers, HEADER_ID);
		const timestamp = getHeaderValue(headers, HEADER_TIMESTAMP);

		if (!sigHeader || !msgId || !timestamp) return false;

		const payload = JSON.stringify(body ?? {});

		// Twitch signature is of form: sha256=hex
		const expected = crypto.createHmac('sha256', secret).update(msgId + timestamp + payload).digest('hex');
		const actual = sigHeader.startsWith('sha256=') ? sigHeader.split('=')[1] : sigHeader;

		// timingSafeEqual requires equal-length buffers
		const expectedBuf = Buffer.from(expected, 'hex');
		const actualBuf = Buffer.from(actual, 'hex');
		if (expectedBuf.length !== actualBuf.length) return false;
		return crypto.timingSafeEqual(expectedBuf, actualBuf);
	},

	normalize(headers: Record<string, string | string[] | undefined>, body: unknown): NormalizedEvent | null {
		const msgType = getHeaderValue(headers, HEADER_TYPE);
		if (body && typeof body === 'object' && 'subscription' in body && 'event' in body) {
			const b = body as { subscription?: Record<string, unknown>; event?: Record<string, unknown> };
			const eventType = String((b.subscription && (b.subscription as Record<string, unknown>)['type']) ?? '');
			if (eventType === 'stream.online' || eventType === 'stream.offline') {
				const ev = b.event as Record<string, unknown>;
				const broadcasterName = String(ev['broadcaster_user_name'] ?? ev['broadcaster_login'] ?? '');
				const url = `https://twitch.tv/${String(ev['broadcaster_user_login'] ?? ev['broadcaster_login'] ?? '')}`;
				const id = String((b.subscription && (b.subscription as Record<string, unknown>)['id']) ?? ev['id'] ?? msgType ?? `${Date.now()}`);
				const title = String(ev['title'] ?? `${broadcasterName} is streaming`);
				const normalized: NormalizedEvent = {
					provider: 'twitch',
					eventType: eventType,
					id: id,
					title,
					url,
					metadata: body as Record<string, unknown>
				};
				return normalized;
			}

			const id = String((b.subscription && (b.subscription as Record<string, unknown>)['id']) ?? `${Date.now()}`);
			const ev = b.event as Record<string, unknown>;
			return {
				provider: 'twitch',
				eventType: String((b.subscription && (b.subscription as Record<string, unknown>)['type']) ?? ''),
				id,
				title: ev['title'] ? String(ev['title']) : (ev['message'] ? String(ev['message']) : undefined),
				url: undefined,
				metadata: body as Record<string, unknown>
			} as NormalizedEvent;
		}

		return null;
	}
};

export default TwitchAdapter;
