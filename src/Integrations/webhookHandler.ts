import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import IntegrationConfigModel from '../Database/Schemas/integrationConfig';
import IntegrationEventModel from '../Database/Schemas/integrationEvent';
import { NormalizedEvent } from './adapter';
import type { ExtendedClient } from '../Structures/Client';
import TwitchAdapter from './twitchAdapter';
import { error as logError, debug as logDebug } from '../Utilities/logger';

const SECRET_HEADER = 'x-integration-secret';

function isDuplicateKeyError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

async function claimIntegrationEvent(eventId: string, provider: string): Promise<boolean> {
	try {
		await IntegrationEventModel.create({ eventId, provider });
		return true;
	} catch (error) {
		if (isDuplicateKeyError(error)) return false;
		throw error;
	}
}

export async function handleIntegrationWebhook(req: Request, res: Response, client?: ExtendedClient) {
	// If client not provided (tests may call handler directly), attempt to load appInstance dynamically.
	let effectiveClient: ExtendedClient | undefined = client;
	if (!effectiveClient) {
		try {
			// dynamic import so module import-time doesn't pull in index.ts circularly
			// tests can mock this module before importing the handler
			const mod = await import('../index');
			effectiveClient = (mod as unknown as { appInstance?: { client?: ExtendedClient } }).appInstance?.client;
		} catch {
			effectiveClient = undefined;
		}
	}
	try {
		// Detect source; prefer explicit header but allow inferring from Twitch EventSub headers
		const headerSource = (req.headers['x-integration-source'] as string) ?? '';
		const isTwitch = headerSource === 'twitch' || !!req.headers['twitch-eventsub-message-type'];

		if (isTwitch) {
			type HeaderLike = Record<string, string | string[] | undefined>;
			const validateFn = TwitchAdapter.validate;
			const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
			const signedBody = rawBody ?? req.body as unknown;
			if (!validateFn || !await Promise.resolve(validateFn(req.headers as HeaderLike, signedBody))) {
				res.status(401).json({ error: 'Unauthorized' });
				return;
			}

			// Twitch EventSub verification challenge
			const msgType = (req.headers['twitch-eventsub-message-type'] as string) ?? '';
			if (msgType === 'webhook_callback_verification') {
				const challenge = req.body && (req.body as { challenge?: unknown }).challenge;
				// Validate Twitch challenge: must be a reasonably sized ASCII string without control characters
				if (
					typeof challenge !== 'string' ||
					challenge.length === 0 ||
					challenge.length > 1024 ||
					!/^[\x20-\x7E]+$/.test(challenge)
				) {
					res.status(400).json({ error: 'invalid challenge' });
					return;
				}
				res.status(200).type('text/plain').send(challenge);
				return;
			}

			const normalized = await Promise.resolve(TwitchAdapter.normalize(req.headers as HeaderLike, req.body as unknown));
			if (!normalized) { res.status(202).json({ status: 'ignored' }); return; }

			// Deduplicate
			const eventKey = normalized.id;
			if (!await claimIntegrationEvent(eventKey, normalized.provider)) {
				res.status(202).json({ status: 'duplicate' });
				return;
			}

			const configs = await IntegrationConfigModel.find({ provider: 'twitch', enabled: true }).lean().exec();

			for (const cfg of configs) {
				try {
					if (!cfg.channelId) continue;
					const channel = await effectiveClient?.channels.fetch(cfg.channelId).catch(() => null);
					if (!channel || !('send' in channel)) continue;

					let message: string;
					if (cfg.template) {
						message = String(cfg.template);
						message = message.replace(/\{\{title\}\}/g, normalized.title ?? '');
						message = message.replace(/\{\{url\}\}/g, normalized.url ?? '');
						const meta = normalized.metadata as unknown;
						let broadcaster = '';
						if (meta && typeof meta === 'object' && 'event' in (meta as Record<string, unknown>)) {
							const ev = (meta as Record<string, unknown>)['event'];
							if (ev && typeof ev === 'object') {
								broadcaster = String((ev as Record<string, unknown>)['broadcaster_user_login'] ?? (ev as Record<string, unknown>)['broadcaster_login'] ?? '');
							}
						}
						message = message.replace(/\{\{broadcaster\}\}/g, broadcaster);
						message = message.replace(/\{\{provider\}\}/g, normalized.provider ?? '');
						message = message.replace(/\{\{eventType\}\}/g, normalized.eventType ?? '');
					} else {
						message = `New ${normalized.provider} event: ${normalized.title ?? 'untitled'}\n${normalized.url ?? ''}`;
					}

					// eslint-disable-next-line no-unused-vars
					const sendFn = (channel as unknown as { send?: (m: string) => Promise<unknown> }).send;
					if (typeof sendFn === 'function') await sendFn(message).catch(() => null);
				} catch (e) {
					logError('Failed to post integration message for config', { config: cfg, error: (e as Error)?.message ?? e });
				}
			}

			res.json({ status: 'accepted' });
			return;
		}

		// Non-Twitch path: validate shared secret
		const secret = process.env.INTEGRATIONS_SECRET ?? '';
		const incomingSecret = (req.headers[SECRET_HEADER] as string) ?? '';
		if (!secret || incomingSecret !== secret) {
			logDebug('Integration secret mismatch', {
				hasExpectedSecret: !!secret,
				incomingLength: typeof incomingSecret === 'string' ? incomingSecret.length : 0
			});
			res.status(401).json({ error: 'Unauthorized' });
			return;
		}

		const source = (req.headers['x-integration-source'] as string) ?? 'generic';
		const normalized: NormalizedEvent = {
			provider: source,
			eventType: req.body?.eventType ?? req.body?.type ?? 'unknown',
			id: (req.body?.id as string) ?? (req.body?.event_id as string) ?? `${Date.now()}`,
			title: req.body?.title ?? req.body?.name,
			url: req.body?.url ?? req.body?.video_url,
			metadata: req.body
		};

		// Deduplicate
		const eventKey = String(normalized.id ?? '');
		if (!await claimIntegrationEvent(eventKey, normalized.provider)) {
			res.status(202).json({ status: 'duplicate' });
			return;
		}

		const configs = await IntegrationConfigModel.find({ provider: source, enabled: true }).lean().exec();

		for (const cfg of configs) {
			try {
				if (!cfg.channelId) continue;
				const channel = await effectiveClient?.channels.fetch(cfg.channelId).catch(() => null);
				if (!channel || !('send' in channel)) continue;

				let message: string;
				if (cfg.template) {
					message = String(cfg.template);
					message = message.replace(/\{\{title\}\}/g, normalized.title ?? '');
					message = message.replace(/\{\{url\}\}/g, normalized.url ?? '');
					message = message.replace(/\{\{provider\}\}/g, normalized.provider ?? '');
					message = message.replace(/\{\{eventType\}\}/g, normalized.eventType ?? '');
				} else {
					message = `New ${normalized.provider} event: ${normalized.title ?? 'untitled'}\n${normalized.url ?? ''}`;
				}

				// eslint-disable-next-line no-unused-vars
				const sendFn = (channel as unknown as { send?: (m: string) => Promise<unknown> }).send;
				if (typeof sendFn === 'function') await sendFn(message).catch(() => null);
			} catch (e) {
				logError('Failed to post integration message for config', { config: cfg, error: (e as Error)?.message ?? e });
			}
		}

		res.json({ status: 'accepted' });
	} catch (err) {
		logError('integration webhook error', { error: (err as Error)?.message ?? err });
		res.status(500).json({ error: 'internal error' });
	}
}

// Router factory: create a router that handles integration webhooks using the provided Discord client.
export function createIntegrationRouter(client: ExtendedClient) {
	const router = express.Router();
	const integrationLimiter = rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 200,
		standardHeaders: true,
		legacyHeaders: false,
		handler: (_req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' }),
	});
	// Expect JSON body to be parsed by the parent express app
	router.post('/', integrationLimiter, (req: Request, res: Response) => handleIntegrationWebhook(req, res, client));
	return router;
}
