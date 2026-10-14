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

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => ({
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&#39;',
})[char] ?? char);

const formatDuration = (seconds: number): string => {
	const totalSeconds = Math.floor(seconds);
	const days = Math.floor(totalSeconds / 86_400);
	const hours = Math.floor((totalSeconds % 86_400) / 3_600);
	const minutes = Math.floor((totalSeconds % 3_600) / 60);
	const parts = [
		days > 0 ? `${days}d` : '',
		hours > 0 ? `${hours}h` : '',
		minutes > 0 ? `${minutes}m` : '',
	].filter(Boolean);

	return parts.slice(0, 2).join(' ') || '<1m';
};

const renderHealthPage = (data: {
	status: string;
	gatewayOk: boolean;
	gatewayStatus?: number;
	discordStatusOk: boolean;
	mongoOk: boolean;
	uptime: number;
	node: string;
	memory: NodeJS.MemoryUsage;
	timestamp: string;
}): string => {
	const healthy = data.status === 'ok';
	const statusLabel = healthy ? 'All systems operational' : 'Service degraded';
	const checkCard = (title: string, label: string, detail: string, ok: boolean): string => `
		<article class="check-card">
			<div class="check-heading">
				<h2>${escapeHtml(title)}</h2>
				<span class="indicator ${ok ? 'good' : 'bad'}" aria-hidden="true"></span>
			</div>
			<p class="check-label">${escapeHtml(label)}</p>
			<p class="check-detail">${escapeHtml(detail)}</p>
		</article>`;
	const formatMb = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="robots" content="noindex">
	<meta http-equiv="refresh" content="30">
	<title>DragonBot Health</title>
	<style>
		:root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #080d19; color: #edf2ff; }
		* { box-sizing: border-box; }
		body { min-height: 100vh; margin: 0; background: radial-gradient(ellipse at 12% 0%, #192a48 0, transparent 38%), radial-gradient(ellipse at 90% 20%, #1a1739 0, transparent 35%), #080d19; }
		.page { width: min(100% - 40px, 1040px); margin: 0 auto; padding: 48px 0 28px; }
		.topbar, .brand, .check-heading, .status-line, .footer { display: flex; align-items: center; }
		.topbar, .check-heading, .footer { justify-content: space-between; }
		.brand { gap: 14px; }
		.brand-mark { display: grid; width: 44px; height: 44px; place-items: center; border: 1px solid #455d91; border-radius: 14px; background: linear-gradient(145deg, #4568bb, #654bc0); box-shadow: 0 8px 28px #243b7b66; font-size: 19px; font-weight: 800; }
		.eyebrow { margin: 0 0 4px; color: #98a9ce; font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
		.brand-name { margin: 0; font-size: 16px; font-weight: 700; }
		.live-pill { display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #2d4353; border-radius: 999px; background: #10221f; color: #a6f2cc; font-size: 12px; font-weight: 650; }
		.live-dot, .indicator { display: inline-block; width: 8px; height: 8px; flex: 0 0 auto; border-radius: 50%; background: #52dc9a; box-shadow: 0 0 12px #52dc9a88; }
		main { padding-top: 52px; }
		.intro h1 { margin: 0; font-size: clamp(32px, 5vw, 46px); letter-spacing: -.045em; }
		.intro p { margin: 10px 0 0; color: #9aa9c7; font-size: 15px; }
		.summary { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 30px; padding: 25px 28px; border: 1px solid #2b3a58; border-radius: 20px; background: linear-gradient(110deg, #14223a, #11172a 70%); box-shadow: 0 18px 50px #0003; }
		.status-line { gap: 15px; }
		.status-icon { display: grid; width: 46px; height: 46px; flex: 0 0 auto; place-items: center; border: 1px solid #2d684e; border-radius: 15px; background: #143626; color: #77e3ad; font-size: 22px; }
		.status-icon.bad { border-color: #70414c; background: #3a2029; color: #ff9eaa; }
		.summary h2 { margin: 0; font-size: 18px; }
		.summary p { margin: 5px 0 0; color: #9aa9c7; font-size: 13px; }
		.status-badge { padding: 7px 11px; border: 1px solid #2d684e; border-radius: 999px; background: #143626; color: #8cf0ba; font-size: 11px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; }
		.status-badge.bad { border-color: #70414c; background: #3a2029; color: #ffadb6; }
		.section-title { margin: 34px 0 14px; color: #9aa9c7; font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
		.checks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
		.check-card, .metric { border: 1px solid #222d45; border-radius: 16px; background: #0e1525cc; }
		.check-card { min-height: 142px; padding: 19px; }
		.check-heading h2 { margin: 0; color: #b9c6df; font-size: 13px; font-weight: 650; }
		.indicator.bad { background: #ff7282; box-shadow: 0 0 12px #ff728288; }
		.check-label { margin: 21px 0 5px; font-size: 17px; font-weight: 700; }
		.check-detail { margin: 0; color: #8492ad; font-size: 12px; }
		.metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
		.metric { padding: 17px 19px; }
		.metric-label { color: #8796b2; font-size: 12px; }
		.metric-value { margin-top: 8px; font-size: 17px; font-weight: 700; }
		.footer { gap: 12px; margin-top: 34px; padding-top: 17px; border-top: 1px solid #202a40; color: #7785a0; font-size: 11px; }
		@media (max-width: 700px) { .page { width: min(100% - 28px, 540px); padding-top: 28px; } main { padding-top: 38px; } .checks { grid-template-columns: 1fr; } .check-card { min-height: auto; } .metrics { grid-template-columns: 1fr; } .summary { align-items: flex-start; padding: 20px; } .status-badge { display: none; } .footer { align-items: flex-start; flex-direction: column; } }
	</style>
</head>
<body>
	<div class="page">
		<header class="topbar">
			<div class="brand">
				<div class="brand-mark" aria-hidden="true">D</div>
				<div><p class="eyebrow">Service status</p><p class="brand-name">DragonBot</p></div>
			</div>
			<div class="live-pill"><span class="live-dot" aria-hidden="true"></span>Live monitoring</div>
		</header>
		<main>
			<section class="intro">
				<h1>System health</h1>
				<p>A live overview of DragonBot and its connected services.</p>
			</section>
			<section class="summary" aria-live="polite">
				<div class="status-line">
					<div class="status-icon ${healthy ? '' : 'bad'}" aria-hidden="true">${healthy ? '&#10003;' : '!'}</div>
					<div><h2>${escapeHtml(statusLabel)}</h2><p>Core services are ${healthy ? 'responding normally' : 'experiencing an issue'}.</p></div>
				</div>
				<span class="status-badge ${healthy ? '' : 'bad'}">${healthy ? 'Operational' : 'Degraded'}</span>
			</section>
			<h2 class="section-title">Connected services</h2>
			<section class="checks" aria-label="Connected service checks">
				${checkCard('Discord Gateway', data.gatewayOk ? 'Reachable' : 'Unavailable', data.gatewayStatus ? `HTTP ${data.gatewayStatus}` : 'Discord API connectivity', data.gatewayOk)}
				${checkCard('Discord Status', data.discordStatusOk ? 'Status feed online' : 'Status feed unavailable', 'Public platform status', data.discordStatusOk)}
				${checkCard('MongoDB', data.mongoOk ? 'Connected' : 'Disconnected', data.mongoOk ? 'Database connection is active' : 'Database connection is unavailable', data.mongoOk)}
			</section>
			<h2 class="section-title">Runtime</h2>
			<section class="metrics" aria-label="Runtime details">
				<div class="metric"><div class="metric-label">Process uptime</div><div class="metric-value">${escapeHtml(formatDuration(data.uptime))}</div></div>
				<div class="metric"><div class="metric-label">Node.js version</div><div class="metric-value">${escapeHtml(data.node)}</div></div>
				<div class="metric"><div class="metric-label">Memory in use</div><div class="metric-value">${escapeHtml(formatMb(data.memory.rss))} RSS</div></div>
			</section>
		</main>
		<footer class="footer"><span>Updated ${escapeHtml(new Date(data.timestamp).toLocaleString())}</span><span>Refreshes automatically every 30 seconds</span></footer>
	</div>
</body>
</html>`;
};

// Register the route handler. Use explicit Request/Response types so overloads are satisfied.
router.get(['/', '/health'], (req: Request, res: Response, next) => {
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

		const responseBody = {
			status: overall,
			checks,
			meta,
			timestamp: new Date().toISOString(),
		};

		if (req.accepts(['json', 'html']) === 'html') {
			return res.status(statusCode).type('html').send(renderHealthPage({
				status: overall,
				gatewayOk: discordGateway?.ok ?? false,
				gatewayStatus: discordGateway?.status,
				discordStatusOk: discordStatus?.ok ?? false,
				mongoOk,
				uptime: meta.uptime,
				node: meta.node,
				memory: meta.memory,
				timestamp: responseBody.timestamp,
			}));
		}

		return res.status(statusCode).json(responseBody);
	})().catch(next);
});

export default router;