import { Router, Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';

// Optionally import your bot client if available and exported.
// import { client } from '../Structures/Client';

export const router = Router();

// Simple in-memory cache to avoid hammering external services.
// Keep it small and process-local; monitoring pings are usually frequent.
const cache: {
	discordGateway?: { ok: boolean; status?: number; ts: number; detail?: any };
	discordStatus?: { ok: boolean; ts: number; detail?: any };
} = {};

const CACHE_TTL_MS = 10_000; // 10s (adjust as needed)
const AXIOS_TIMEOUT = 3000; // 3s

// overloads for express.Router.get can be a bit strict in some TS setups — narrow using a one-off cast
(router as any).get('/health', async (req: Request, res: Response) => {
	const now = Date.now();

	// Helper to check cached value
	const getCached = <K extends keyof typeof cache>(key: K, ttl = CACHE_TTL_MS): typeof cache[K] | undefined =>
		cache[key] && now - (cache[key]!.ts ?? 0) < ttl ? cache[key] : undefined;

	// 1) Discord Gateway (public)
	let discordGateway = getCached('discordGateway');
	if (!discordGateway) {
		try {
			const response = await axios.get('https://discord.com/api/v9/gateway', { timeout: AXIOS_TIMEOUT });
			discordGateway = { ok: response.status === 200, status: response.status, ts: now, detail: { headers: { 'x-ratelimit-remaining': response.headers['x-ratelimit-remaining'] } } } as typeof cache['discordGateway'];
		} catch (err: any) {
			discordGateway = { ok: false, status: err?.response?.status, ts: now, detail: { message: err.message } } as typeof cache['discordGateway'];
		}
		cache.discordGateway = discordGateway;
	}

	// 2) Discord status (status page) — helpful for platform-wide incidents
	let discordStatus = getCached('discordStatus');
	if (!discordStatus) {
		try {
			const r = await axios.get('https://discordstatus.com/api/v2/summary.json', { timeout: AXIOS_TIMEOUT });
			discordStatus = { ok: r.status === 200, ts: now, detail: r.data };
		} catch (err: any) {
			discordStatus = { ok: false, ts: now, detail: { message: err.message } };
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
});

export default router;