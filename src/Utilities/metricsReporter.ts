import axios, { AxiosError } from 'axios';
import { Client } from 'discord.js';
import { info, error } from './logger';
import { config } from 'dotenv';
config();

const DEFAULT_INTERVAL_MS = 10_000; // 10s
const MAX_BACKOFF_MS = 5 * 60_000; // 5 minutes

type CmdEntry = { timestamps: number[]; category?: string };
const commandTimestampsMap: Map<string, CmdEntry> = new Map();

export function recordCommandTimestamp(commandName?: string, category?: string, ts = Date.now()) {
	const name = commandName ?? 'unknown';
	const entry = commandTimestampsMap.get(name) ?? { timestamps: [], category } as CmdEntry;
	entry.timestamps.push(ts);
	if (!entry.category && category) entry.category = category;
	commandTimestampsMap.set(name, entry);
}

function commandsPerMinute(): number {
	const cutoff = Date.now() - 60_000;
	let total = 0;
	for (const [name, entry] of commandTimestampsMap) {
		const filtered = entry.timestamps.filter(t => t >= cutoff);
		if (filtered.length === 0) commandTimestampsMap.delete(name);
		else commandTimestampsMap.set(name, { ...entry, timestamps: filtered });
		total += filtered.length;
	}
	return total;
}

function topCommands(limit = 5) {
	const cutoff = Date.now() - 60_000;
	const counts: Array<{ name: string; count: number; category?: string }> = [];
	for (const [name, entry] of commandTimestampsMap) {
		const filtered = entry.timestamps.filter(t => t >= cutoff);
		if (filtered.length === 0) continue;
		counts.push({ name, count: filtered.length, category: entry.category });
	}
	counts.sort((a, b) => b.count - a.count);
	return counts.slice(0, limit);
}

export function startMetricsReporter(client: Client) {
	let stopped = false;
	let backoff = DEFAULT_INTERVAL_MS;

	async function sendOnce() {
		if (stopped) return;
		const dashboardUrl = process.env.DASHBOARD_URL;
		const secret = process.env.INTERNAL_SECRET;
		if (!dashboardUrl || !secret) {
			info('metrics: skipping push; DASHBOARD_URL or INTERNAL_SECRET not configured');
			return;
		}

		const serverCount = client.guilds.cache.size;
		const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount ?? 0), 0) || client.users.cache.size;
		const payload = {
			server_count: serverCount,
			total_users: totalUsers,
			ws_ping: Math.round(client.ws.ping),
			commands_per_min: commandsPerMinute(),
			top_commands: topCommands(),
			uptime_ms: client.uptime ?? 0
		};

		try {
			const base = dashboardUrl.replace(/\/$/, '');
			const candidatePaths = [
				'/api/v1/bot/internal',
				'/api/bot/internal',
				'/bot/internal'
			];

			let lastError: unknown = null;
			let succeeded = false;
			for (const p of candidatePaths) {
				const fullUrl = `${base}${p}`;
				try {
					await axios.post(fullUrl, payload, {
						headers: { 'x-internal-secret': secret, 'content-type': 'application/json' },
						timeout: 5000
					});
					succeeded = true;
					// success — intentionally not logging routine successful pushes to reduce noise
					break;
				} catch (err) {
					lastError = err;
					const axiosErr = err as unknown as AxiosError;
					const status = axiosErr?.response?.status;
					// If 404, try next candidate. Otherwise stop trying.
					if (status === 404) {
						continue;
					}
					error('metrics: failed to push metrics', { url: fullUrl, status, message: axiosErr?.message ?? String(err) });
					break;
				}
			}

			if (!succeeded) {
				const e = lastError as unknown as AxiosError | null;
				error('metrics: all endpoints failed or not found', { message: e?.message ?? 'no response', status: e?.response?.status });
				backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
			} else {
				backoff = DEFAULT_INTERVAL_MS;
			}
		} catch (err) {
			const e = err as Error;
			error('metrics: failed to push metrics (unexpected)', { message: e.message });
			backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
		}
		// schedule next
		if (!stopped) setTimeout(sendOnce, backoff);
	};

	// start loop
	setTimeout(sendOnce, DEFAULT_INTERVAL_MS);

	return () => { stopped = true; };
}

export default { startMetricsReporter, recordCommandTimestamp };
