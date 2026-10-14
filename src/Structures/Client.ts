import { ActivityType, ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import { config } from 'dotenv';
import { glob } from 'glob';
import { Agent } from 'undici';

// `glob`'s export shape can vary between versions/ESM vs CJS. Wrap the
// callback-style API in a Promise to ensure a consistent, typed async helper.
const PG = async (pattern: string, options?: any) => {
	// Try promise-returning API first (modern glob versions), then callback,
	// then sync as a last resort. This makes the helper robust across
	// different installed `glob` versions / runtime shapes.
	try {
		const possible = (glob as any)(pattern, options);
		if (possible && typeof possible.then === 'function') {
			return (await possible) as string[];
		}
	} catch (e) {
		// ignore and try callback/sync fallback
	}

	return await new Promise<string[]>((resolve, reject) => {
		try {
			(glob as any)(pattern, options ?? {}, (err: Error | null, matches: string[]) => {
				if (err) return reject(err);
				resolve(matches ?? []);
			});
		} catch (err) {
			try {
				const syncMatches = (glob as any).sync ? (glob as any).sync(pattern, options) : [];
				resolve(syncMatches ?? []);
			} catch (e) {
				reject(err);
			}
		}
	});
};

import { CommandType } from '../Typings/Command';
import { ButtonType } from '../Typings/Button';
import { RegisterCommandOptions } from '../Typings/client';
import { Event } from './Event';
import { error as logError, info as logInfo, warn as logWarn } from '../Utilities/logger';
config();

import path from 'path';

export class ExtendedClient extends Client {
	commands: Collection<string, CommandType> = new Collection();
	buttons: Collection<string, ButtonType> = new Collection();

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.GuildWebhooks,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildPresences,
				GatewayIntentBits.GuildMessagePolls,
			],
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
				Partials.User,
				Partials.SoundboardSound,
			],
			// Restrict allowed mentions by default to avoid accidental mass pings.
			// Individual sends may opt-in to mentions explicitly when needed.
			allowedMentions: { parse: [], repliedUser: false },
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				MessageManager: { maxSize: 200 },
			}),
			presence: { activities: [{ name: 'Im DragonBot', type: ActivityType.Watching, url: 'https://github.com/skullgaming31/dragonbot' }], afk: false, status: 'online' },
		});
	}

	async start() {
		const agent = new Agent({ connect: { timeout: 300000 } });
		this.rest.setAgent(agent);
		await this.registerModules();
		// Guard: if ENVIRONMENT is explicitly set to an unknown value, surface an error
		const env = process.env.ENVIRONMENT;
		const allowed = new Set(['dev', 'debug', 'prod']);
		if (typeof env === 'string' && env.length > 0 && !allowed.has(env)) {
			const msg = `Invalid ENVIRONMENT value: "${env}". Allowed: dev|debug|prod`;
			logError(msg);
			throw new Error(msg);
		}
		switch (env) {
			case 'dev':
			case 'debug':
				await this.login(process.env.DEV_DISCORD_BOT_TOKEN);
				break;
			case 'prod':
				await this.login(process.env.DISCORD_BOT_TOKEN);
				break;
		}
	}

	async importFile(filePath: string) {
		// Prefer require for TypeScript files when using ts-node
		if (filePath.endsWith('.ts')) {

			const mod = require(filePath);
			return mod?.default ?? mod;
		}

		// For JS files, require by absolute path to avoid file:// URL issues in compiled CommonJS
		const mod = require(filePath);
		return mod?.default ?? mod;
	}

	async registerCommands({ commands, guildId }: RegisterCommandOptions): Promise<void> {
		if (guildId) {
			const guild = this.guilds.cache.get(guildId);
			if (!guild) {
				logWarn(`Guild ${guildId} not found`);
				return;
			}
			try {
				const commandsList = await guild.commands.set(commands);
				logInfo(`Commands registered for guild ${guildId}: ${commandsList.size}`, { guildId, count: commandsList.size });
				logInfo('registerCommands: registered guild commands', { guildId, count: commandsList.size });
			} catch (err) {
				logError('registerCommands: failed to register guild commands', { error: (err as Error)?.message ?? err, guildId });
			}
		} else {
			try {
				const commandsList = await this.application?.commands.set(commands);
				logInfo(`Global commands registered: ${commandsList?.size}`, { count: commandsList?.size });
			} catch (err) {
				logError('registerCommands: failed to register global commands', { error: (err as Error)?.message ?? err });
			}
		}
	}

	async registerModules() {
		// Helper to avoid loading test files (test-helpers, .spec, .test) as runtime modules
		const isTestFile = (fp: string) => /(?:\.test(?:-helpers)?|\.spec)\.(ts|js)$/i.test(fp.replace(/\\/g, '/'));
		const slashCommands: ApplicationCommandDataResolvable[] = [];
		// Use glob to find files. Prefer `src` when running from source (ts-node),
		// otherwise prefer `dist`. Scanning both can import modules twice
		// (src + dist) and cause issues like mongoose model overwrite.
		const runningFromSource = __dirname.includes(`${path.sep}src${path.sep}`) || process.execArgv.join(' ').includes('ts-node') || process.argv.some(a => a?.endsWith?.('.ts'));
		const patterns = runningFromSource
			? [path.resolve(__dirname, '..', 'Commands', '*', '*.{ts,js}')]
			: [path.resolve(process.cwd(), 'dist', 'Commands', '*', '*.{js,ts}')];
		const found = new Set<string>();
		for (const p of patterns) {
			try {
				// Normalize Windows backslashes to forward slashes so `glob` matches reliably
				const pattern = typeof p === 'string' ? p.replace(/\\/g, '/') : p;
				// logInfo('registerModules: trying pattern', { pattern });
				const hits = await PG(pattern, {});
				// logInfo('registerModules: pattern hits', { pattern, hits: hits.length, sample: hits.slice(0, 5) });
				for (const h of hits) {
					if (isTestFile(h)) {
						// logWarn('registerModules: skipping test file', { path: h });
						continue;
					}
					found.add(h);
				}
			} catch (e) {
				logWarn('registerModules: glob failed for pattern', { pattern: p, error: (e as Error)?.message ?? e });
			}
		}
		const commandFiles = Array.from(found.values());
		// logInfo('registerModules: found command files', { count: commandFiles.length });

		for (const filePath of commandFiles) {
			const command: CommandType = await this.importFile(filePath);
			if (!command) {
				logWarn(`registerModules: imported falsy command from ${filePath}`);
				continue;
			}
			if (!('name' in command) || !command.name) {
				logWarn(`registerModules: command missing name from ${filePath}`, { sample: Object.keys(command) });
				continue;
			}
			// logInfo('registerModules: loading command', { name: command.name, path: filePath });
			if (this.commands.has(command.name)) {
				logWarn(`Duplicate command name detected: ${command.name} (from ${filePath}) - skipping`);
				continue;
			}
			this.commands.set(command.name, command);
			slashCommands.push(command as unknown as ApplicationCommandDataResolvable);
		}

		const dedupedCommands = Array.from(new Map(slashCommands.map((c: ApplicationCommandDataResolvable & { name?: string }) => [c.name ?? '', c])).values());

		const doRegister = () => {
			switch (process.env.ENVIRONMENT) {
				case 'dev':
					this.registerCommands({ commands: dedupedCommands, guildId: process.env.DEV_DISCORD_GUILD_ID });
					logInfo('ENVIRONMENT: ', { env: process.env.ENVIRONMENT });
					break;
				case 'debug':
				case 'prod':
					this.registerCommands({ commands: dedupedCommands, guildId: undefined });
					logInfo('ENVIRONMENT: ', { env: process.env.ENVIRONMENT });
					break;
				default:
					logInfo('ENVIRONMENT: ', { env: process.env.ENVIRONMENT });
			}
		};

		// If the client is already ready, register immediately. Otherwise wait for `clientReady`.
		if (this.user) doRegister();
		else this.once('clientReady', doRegister);

		// Events and Buttons: prefer src when running from source to avoid double-importing
		const eventPatterns = runningFromSource
			? [path.resolve(__dirname, '..', 'Events', '*', '*.{ts,js}')]
			: [path.resolve(process.cwd(), 'dist', 'Events', '*', '*.{js,ts}')];
		const btnPatterns = runningFromSource
			? [path.resolve(__dirname, '..', 'Buttons', '*.{ts,js}')]
			: [path.resolve(process.cwd(), 'dist', 'Buttons', '*.{js,ts}')];
		const eventFound = new Set<string>();
		for (const p of eventPatterns) {
			try {
				const pattern = typeof p === 'string' ? p.replace(/\\/g, '/') : p;
				const hits = await PG(pattern, {});
				for (const h of hits) {
					if (isTestFile(h)) {
						// logWarn('registerModules: skipping test event file', { path: h });
						continue;
					}
					eventFound.add(h);
				}
			} catch (e) {
				logWarn('registerModules: glob failed for event pattern', { pattern: p, error: (e as Error)?.message ?? e });
			}
		}
		const eventFiles = Array.from(eventFound.values());

		const btnFound = new Set<string>();
		for (const p of btnPatterns) {
			try {
				const pattern = typeof p === 'string' ? p.replace(/\\/g, '/') : p;
				const hits = await PG(pattern, {});
				for (const h of hits) {
					if (isTestFile(h)) {
						logWarn('registerModules: skipping test button file', { path: h });
						continue;
					}
					btnFound.add(h);
				}
			} catch (e) {
				logWarn('registerModules: glob failed for button pattern', { pattern: p, error: (e as Error)?.message ?? e });
			}
		}
		const buttonFiles = Array.from(btnFound.values());

		for (const filePath of buttonFiles) {
			const btn: ButtonType = await this.importFile(filePath);
			if (!btn || !btn.customId) continue;
			if (this.buttons.has(btn.customId)) {
				logWarn(`Duplicate button customId detected: ${btn.customId} (from ${filePath}) - skipping`);
				continue;
			}
			this.buttons.set(btn.customId, btn);
		}

		for (const filePath of eventFiles) {
			const event: Event<keyof ClientEvents> | undefined = await this.importFile(filePath);
			if (!event || typeof (event as any).run !== 'function' || !('event' in (event as any))) {
				logWarn('registerModules: invalid event module, skipping', { path: filePath, keys: Object.keys(event ?? {}) });
				continue;
			}
			if (event.event === 'clientReady') this.once(event.event, event.run);
			else this.on(event.event, event.run);
		}
	}
}
