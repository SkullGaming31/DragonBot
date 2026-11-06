import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import IntegrationConfigModel from '../Database/Schemas/integrationConfig';
import IntegrationEventModel from '../Database/Schemas/integrationEvent';
import { NormalizedEvent } from './adapter';
import type { ExtendedClient } from '../Structures/Client';
import TwitchAdapter from './twitchAdapter';
import { error as logError, debug as logDebug } from '../Utilities/logger';
import { randomUUID } from 'crypto';

const SECRET_HEADER = 'x-integration-secret';

function isDuplicateKeyError(error: unknown): boolean {
	return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

async function claimIntegrationEvent(eventId: string, provider: string, token: string): Promise<'claimed' | 'duplicate' | 'busy'> {
	const now = new Date();
	const leaseUntil = new Date(now.getTime() + 300000);
	try {
		await IntegrationEventModel.create({ eventId, provider, status: 'processing', leaseToken: token, leaseUntil });
		return 'claimed';
	} catch (error) {
		if (!isDuplicateKeyError(error)) throw error;
	}
	const event = await IntegrationEventModel.findOneAndUpdate(
		{ eventId, provider, $or: [{ status: 'failed' }, { status: 'processing', leaseUntil: { $lte: now } }] },
		{ $set: { status: 'processing', leaseToken: token, leaseUntil } }, { new: true }
	);
	if (event) return 'claimed';
	const current = await IntegrationEventModel.findOne({ eventId });
	return current && (current.status === 'complete' || !current.status) ? 'duplicate' : 'busy';
}

async function deliverEvent(event: NormalizedEvent, client?: ExtendedClient): Promise<'accepted' | 'duplicate' | 'busy'> {
	const token = randomUUID();
	const eventId = String(event.id);
	const claim = await claimIntegrationEvent(eventId, event.provider, token);
	if (claim !== 'claimed') return claim;

	try {
		const claimed = await IntegrationEventModel.findOne({ eventId, leaseToken: token }).lean();
		if (!claimed) throw new Error('Integration event lease lost');
		const delivered = new Set(claimed.deliveredConfigIds ?? []);
		const configs = await IntegrationConfigModel.find({ provider: event.provider, enabled: true }).lean().exec();
		for (const cfg of configs) {
			const configId = String(cfg._id);
			if (delivered.has(configId) || !cfg.channelId) continue;
			if (!client) throw new Error('Discord client unavailable');
			const channel = await client.channels.fetch(cfg.channelId);
			if (!channel || !('send' in channel) || typeof channel.send !== 'function') throw new Error(`Integration channel unavailable: ${cfg.channelId}`);
			const meta = event.metadata as unknown;
			let broadcaster = '';
			if (meta && typeof meta === 'object' && 'event' in meta) {
				const sourceEvent = meta.event;
				if (sourceEvent && typeof sourceEvent === 'object') {
					const source = sourceEvent as Record<string, unknown>;
					broadcaster = String(source.broadcaster_user_login ?? source.broadcaster_login ?? '');
				}
			}
			const message = cfg.template
				? String(cfg.template)
					.replace(/\{\{title\}\}/g, event.title ?? '')
					.replace(/\{\{url\}\}/g, event.url ?? '')
					.replace(/\{\{broadcaster\}\}/g, broadcaster)
					.replace(/\{\{provider\}\}/g, event.provider)
					.replace(/\{\{eventType\}\}/g, event.eventType ?? '')
				: `New ${event.provider} event: ${event.title ?? 'untitled'}\n${event.url ?? ''}`;
			await channel.send(message);
			const result = await IntegrationEventModel.updateOne({ eventId, status: 'processing', leaseToken: token }, { $addToSet: { deliveredConfigIds: configId }, $set: { leaseUntil: new Date(Date.now() + 300000) } });
			if (!result.matchedCount) throw new Error('Integration event lease lost after delivery');
		}
		const completed = await IntegrationEventModel.updateOne({ eventId, status: 'processing', leaseToken: token }, { $set: { status: 'complete', leaseToken: null, leaseUntil: null } });
		if (!completed.matchedCount) throw new Error('Integration event lease lost before completion');
		return 'accepted';
	} catch (error) {
		await IntegrationEventModel.updateOne({ eventId, status: 'processing', leaseToken: token }, { $set: { status: 'failed', leaseToken: null, leaseUntil: null } });
		throw error;
	}
}

async function respondToEvent(event: NormalizedEvent, res: Response, client?: ExtendedClient): Promise<void> {
	const status = await deliverEvent(event, client);
	if (status === 'busy') {
		res.status(503).json({ error: 'Event delivery in progress; retry later' });
	} else if (status === 'duplicate') {
		res.status(202).json({ status });
	} else {
		res.json({ status });
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

			await respondToEvent(normalized, res, effectiveClient);
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

		await respondToEvent(normalized, res, effectiveClient);
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
