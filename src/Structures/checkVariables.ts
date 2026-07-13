import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();
import { error as logError } from '../Utilities/logger';

// Read .env.example and ensure required keys exist and are non-empty in the loaded env
export function checkVariables(env: NodeJS.ProcessEnv): void {

	try {
		const examplePath = path.resolve(process.cwd(), '.env.example');
		if (!fs.existsSync(examplePath)) return;

		const raw = fs.readFileSync(examplePath, 'utf8');
		const keys = raw
			.split(/\r?\n/)
			.map(l => l.trim())
			.filter(l => l.length > 0 && !l.startsWith('#'))
			.map(l => l.split('=')[0].trim())
			.filter(Boolean);

		const unique = Array.from(new Set(keys));
		const missing: string[] = [];

		// Prefer parsing .env file directly so we validate what's in the .env file
		const envPath = path.resolve(process.cwd(), '.env');
		let sourceLabel = 'process.env';
		const parsedEnv: Record<string, string | undefined> = {};
		if (fs.existsSync(envPath)) {
			sourceLabel = '.env';
			const rawEnv = fs.readFileSync(envPath, 'utf8');
			for (const line of rawEnv.split(/\r?\n/)) {
				const l = line.trim();
				if (!l || l.startsWith('#')) continue;
				const idx = l.indexOf('=');
				if (idx === -1) continue;
				const k = l.slice(0, idx).trim();
				let v = l.slice(idx + 1);
				// remove surrounding quotes if present
				if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith('\'') && v.endsWith('\''))) {
					v = v.slice(1, -1);
				}
				parsedEnv[k] = v;
			}
		}

		for (const key of unique) {
			if (key === 'npm_config_noproxy') continue;
			const val = (Object.prototype.hasOwnProperty.call(parsedEnv, key) ? parsedEnv[key] : (env[key] as string | undefined));
			if (val === undefined || val === '') {
				missing.push(key);
				logError(`Missing or empty environment variable in ${sourceLabel}: ${key}`);
			}
		}

		if (missing.length > 0) {
			logError(`Detected ${missing.length} missing/empty environment variables (checked ${sourceLabel}). Check .env or .env.example for required keys.`);
		}
	} catch (err) {
		// Don't throw during startup; just log the issue and continue.
		logError('Error checking environment variables', { error: (err as Error)?.message ?? err });
	}
}

// export default { checkVariables };
