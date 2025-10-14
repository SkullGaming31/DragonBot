import { ActivityType, ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import { config } from 'dotenv';
import glob from 'glob';
import { Agent } from 'undici';
import { promisify } from 'util';
const PG = promisify(glob);

import { CommandType } from '../Typings/Command';
import { RegisterCommandOptions } from '../Typings/client';
import { Event } from './Event';
config();

export class ExtendedClient extends Client {
	commands: Collection<string, CommandType> = new Collection();

	/**
	 * Constructs a new ExtendedClient instance.
	 *
	 * @remarks
	 * The client is constructed with the following options:
	 * - Gateway intents: Guilds, GuildMembers, GuildMessages, MessageContent, GuildWebhooks, GuildMessageReactions, GuildPresences
	 * - Partials: Channel, GuildMember, GuildScheduledEvent, Message, Reaction, ThreadMember, User
	 * - Allowed mentions: everyone, roles, users
	 * - Cache: limited to 200 messages
	 * - Presence: watching "Im DragonBot", afk false, status online
	 */
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
				GatewayIntentBits.GuildMessagePolls
			],
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
				Partials.User,
				Partials.SoundboardSound
			],
			allowedMentions: { parse: ['everyone', 'roles', 'users'] },
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				MessageManager: { maxSize: 200 }
			}),
			presence: { activities: [{ name: 'Im DragonBot', type: ActivityType.Watching, url: 'https://github.com/skullgaming31/dragonbot' }], afk: false, status: 'online' },
		});
	}

	/**
	 * Logs the bot into Discord and registers all commands, events, and modules.
	 * @async
	 */
	async start() {
		const agent = new Agent({
			connect: {
				timeout: 300000
			}
		});

		this.rest.setAgent(agent);
		await this.registerModules();
		switch (process.env.Enviroment) {
			case 'dev':
			case 'debug':
				await this.login(process.env.DEV_DISCORD_BOT_TOKEN);
				break;
			case 'prod':
				await this.login(process.env.DISCORD_BOT_TOKEN);
				break;
		}
	}

	async importFile(filePath: string) { return (await import(filePath))?.default; }

	/**
	 * Registers commands for a guild or globally
	 * @param {RegisterCommandOptions} options - The options for registering the commands
	 * @param {ApplicationCommandDataResolvable[]} options.commands - The commands to register
	 * @param {string} [options.guildId] - The ID of the guild to register the commands for. If not provided, the commands will be registered globally.
	 * @returns {Promise<void>}
	 */
	async registerCommands({ commands, guildId }: RegisterCommandOptions): Promise<void> {
		if (guildId) {
			const guild = this.guilds.cache.get(guildId);
			if (!guild) {
				console.log(`Guild ${guildId} not found`);
				return;
			}
			const commandsList = await guild.commands.set(commands);
			console.log(`Commands registered for guild ${guildId}: ${commandsList.size}`);
		} else {
			const commandsList = await this.application?.commands.set(commands);
			console.log(`Global commands registered: ${commandsList?.size}`);
		}
	}

	/**
	 * Registers all commands and events in the bot
	 * @description This method is called when the bot is ready. It registers all commands and events in the bot.
	 * @example
	 *
	 */
	async registerModules() {
		// Commands
		const slashCommands: ApplicationCommandDataResolvable[] = [];
		const commandFiles = await PG(`${__dirname}/../Commands/*/*{.ts,.js}`, {});

		commandFiles.forEach(async (filePath: string) => {
			const command: CommandType = await this.importFile(filePath);

			if (!command.name) return;

			this.commands.set(command.name, command);
			slashCommands.push(command);
		});

		this.on('clientReady', () => {
			switch (process.env.Enviroment) {
				case 'dev':
					this.registerCommands({ commands: slashCommands, guildId: process.env.DEV_DISCORD_GUILD_ID });
					console.log('Environment: ', process.env.Enviroment);
					break;
				case 'prod':
					this.registerCommands({ commands: slashCommands, guildId: undefined });
					console.log('Environment: ', process.env.Enviroment);
					break;
				default:
					console.log('Environment: ', process.env.Enviroment);
			}
		});

		// Events
		const eventFiles = await PG(`${__dirname}/../Events/*/*{.ts,.js}`);

		eventFiles.forEach(async (filePath: string) => {
			const event: Event<keyof ClientEvents> = await this.importFile(filePath);
			if (event.event === 'clientReady') {
				this.once(event.event, event.run);
			} else {
				this.on(event.event, event.run);
			}
		});
	}
}