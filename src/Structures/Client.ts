import { ActivityType, ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import { config } from 'dotenv';
import glob from 'glob';
import { Agent } from 'undici';
import { promisify } from 'util';
const PG = promisify(glob);

import { CommandType } from '../Typings/Command';
import { ButtonType } from '../Typings/Button';
import { RegisterCommandOptions } from '../Typings/client';
import { Event } from './Event';
import { error as logError, info as logInfo, warn as logWarn } from '../Utilities/logger';
config();

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
		// Guard: if Enviroment is explicitly set to an unknown value, surface an error
		const env = process.env.Enviroment;
		const allowed = new Set(['dev', 'debug', 'prod']);
		if (typeof env === 'string' && env.length > 0 && !allowed.has(env)) {
			const msg = `Invalid Enviroment value: "${env}". Allowed: dev|debug|prod`;
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
		const slashCommands: ApplicationCommandDataResolvable[] = [];
		const commandFiles = await PG(`${__dirname}/../Commands/*/*{.ts,.js}`, {});

		for (const filePath of commandFiles) {
			const command: CommandType = await this.importFile(filePath);
			if (!command || !command.name) continue;
			if (this.commands.has(command.name)) {
				logWarn(`Duplicate command name detected: ${command.name} (from ${filePath}) - skipping`);
				continue;
			}
			this.commands.set(command.name, command);
			slashCommands.push(command as unknown as ApplicationCommandDataResolvable);
		}

		this.on('clientReady', () => {
			const dedupedCommands = Array.from(new Map(slashCommands.map((c: ApplicationCommandDataResolvable & { name?: string }) => [c.name ?? '', c])).values());
			switch (process.env.Enviroment) {
				case 'dev':
					this.registerCommands({ commands: dedupedCommands, guildId: process.env.DEV_DISCORD_GUILD_ID });
					logInfo('Environment: ', { env: process.env.Enviroment });
					break;
				case 'prod':
					this.registerCommands({ commands: dedupedCommands, guildId: undefined });
					logInfo('Environment: ', { env: process.env.Enviroment });
					break;
				default:
					logInfo('Environment: ', { env: process.env.Enviroment });
			}
		});

		const eventFiles = await PG(`${__dirname}/../Events/*/*{.ts,.js}`);
		const buttonFiles = await PG(`${__dirname}/../Buttons/*{.ts,.js}`);

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
			const event: Event<keyof ClientEvents> = await this.importFile(filePath);
			if (event.event === 'clientReady') this.once(event.event, event.run);
			else this.on(event.event, event.run);
		}
	}
}
