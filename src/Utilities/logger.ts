import fs from 'fs/promises';
import path from 'path';
import LogEntryModel from '../Database/Schemas/logEntry';

type Level = 'info' | 'warn' | 'error' | 'debug';

async function writeFileLog(line: string) {
	// Prefer a runtime-location-aware path:
	// 1) When running compiled code the module __dirname will be under `.../dist/Utilities`.
	//    In that case write to `.../dist/devLogs` so logs live with the deployed artifact.
	// 2) Otherwise fall back to the project root `process.cwd()/devLogs` (useful for local dev).
	const candidates = [
		path.resolve(__dirname, '..', 'devLogs'), // near the module (dist/devLogs when compiled)
		path.resolve(process.cwd(), 'devLogs'), // project root devLogs
	];

	let lastError: unknown = null;
	for (const logsDir of candidates) {
		try {
			await fs.mkdir(logsDir, { recursive: true });
			await fs.appendFile(path.join(logsDir, 'logs.log'), line);
			return;
		} catch (e) {
			lastError = e;
			// try next candidate
		}
	}

	// If all candidates failed, log the error to console as a last resort.
	console.error('logger: failed to write file log to candidates', lastError);
}

export async function log(level: Level, message: string, meta?: Record<string, unknown>) {
	const timestamp = new Date().toISOString();
	const line = `${timestamp} [${level.toUpperCase()}] ${message} ${meta ? JSON.stringify(meta) : ''}\n`;

	// Console output
	if (level === 'error') console.error(line);
	else if (level === 'warn') console.warn(line);
	else console.log(line);

	// Write to file for persistence
	await writeFileLog(line);

	// Save to DB (best-effort)
	try {
		await LogEntryModel.create({ level, message, meta, createdAt: new Date() });
	} catch (e) {
		// ignore DB errors to keep logging non-blocking

		console.error('logger: failed to write DB log', e);
	}
}

export const info = (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta);
export const warn = (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta);
export const error = (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta);
export const debug = (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta);
