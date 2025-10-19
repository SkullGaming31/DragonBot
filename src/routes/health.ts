import { Router, Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import { error } from 'console';

export const router = Router();

// Simple in-memory cache to avoid hammering external services.
// Keep it small and process-local; monitoring pings are usually frequent.
type GatewayDetail = { headers?: { 'x-ratelimit-remaining'?: string } } | { message?: string } | unknown;
type StatusDetail = unknown;
const cache: {
	discordGateway?: { ok: boolean; status?: number; ts: number; detail?: GatewayDetail };
	discordStatus?: { ok: boolean; ts: number; detail?: StatusDetail };
} = {};

const CACHE_TTL_MS = 10_000; // 10s (adjust as needed)
const AXIOS_TIMEOUT = 3000; // 3s

// Register the route handler. Use explicit Request/Response types so overloads are satisfied.
router.get('/health', (req: Request, res: Response, next) => {
	void (async () => {
		const now = Date.now();

		// Helper to check cached value
		const getCached = <K extends keyof typeof cache>(key: K, ttl = CACHE_TTL_MS): typeof cache[K] | undefined =>
			cache[key] && now - (cache[key]!.ts ?? 0) < ttl ? cache[key] : undefined;

		// 1) Discord Gateway (public)
		let discordGateway = getCached('discordGateway');
		if (!discordGateway) {
			try {
				const response = await axios.get('https://discord.com/api/v9/gateway', { timeout: AXIOS_TIMEOUT });
				discordGateway = {
					ok: response.status === 200,
					status: response.status,
					ts: now,
					detail: { headers: { 'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'] } }
				};
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				// try to extract an HTTP status if available from common axios error shape
				let status: number | undefined;
				if (err && typeof err === 'object') {
					const maybe = err as { response?: { status?: number } };
					status = maybe.response?.status;
				}
				discordGateway = { ok: false, status, ts: now, detail: { message } };
			}
			cache.discordGateway = discordGateway;
		}

		// 2) Discord status (status page) — helpful for platform-wide incidents
		let discordStatus = getCached('discordStatus');
		if (!discordStatus) {
			try {
				const r = await axios.get('https://discordstatus.com/api/v2/summary.json', { timeout: AXIOS_TIMEOUT });
				discordStatus = { ok: r.status === 200, ts: now, detail: r.data };
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : String(err);
				discordStatus = { ok: false, ts: now, detail: { message } };
			}
			cache.discordStatus = discordStatus;
		}

		// 3) MongoDB (mongoose) connectivity
		let mongoOk = false;
		try {
			// mongoose.connection.readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
			const state = mongoose.connection.readyState;
			mongoOk = state === 1;
		} catch (err) {
			error('health: MongoDB connectivity check failed', { error: (err as Error)?.message ?? err });
			mongoOk = false;
		}

		// 4) Bot client readiness (optional). Uncomment / adapt if you can import client.
		// let botReady = false;
		// try {
		//   botReady = client && client.isReady(); // or client.user != null & client.ws.status === 0 etc.
		// } catch (err) {
		//   botReady = false;
		// }

		// meta: process and package info
		const meta = {
			uptime: process.uptime(),
			memory: process.memoryUsage(),
			node: process.version,
			// version: require('../../package.json').version, // optionally include package version
		};

		// Compose response: if any critical check fails, return 503
		const checks = {
			discordGateway,
			discordStatus,
			mongo: { ok: mongoOk },
			// bot: { ok: botReady }
		};

		const criticalOk = (discordGateway?.ok ?? false) && mongoOk; // adapt which checks are critical
		const statusCode = criticalOk ? 200 : 503;
		const overall = criticalOk ? 'ok' : 'degraded';

		return res.status(statusCode).json({
			status: overall,
			checks,
			meta,
			timestamp: new Date().toISOString(),
		});
	})().catch(next);
});

export default router;