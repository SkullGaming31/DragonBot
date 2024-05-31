// import { ActivityType, ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
// import { config } from 'dotenv';
// import glob from 'glob';
// import { Agent } from 'undici';
// import { promisify } from 'util';
// const PG = promisify(glob);

// import { CommandType } from '../Typings/Command';
// import { RegisterCommandOptions } from '../Typings/client';
// import { Event } from './Event';
// config();

// export class ExtendedClient extends Client {
// 	commands: Collection<string, CommandType> = new Collection();

// 	constructor() {
// 		super({
// 			intents: [
// 				GatewayIntentBits.Guilds,
// 				GatewayIntentBits.GuildMembers,
// 				GatewayIntentBits.GuildMessages,
// 				GatewayIntentBits.MessageContent,
// 				GatewayIntentBits.GuildWebhooks,
// 				GatewayIntentBits.GuildMessageReactions,
// 				GatewayIntentBits.GuildPresences,
// 			],
// 			partials: [
// 				Partials.Channel,
// 				Partials.GuildMember,
// 				Partials.GuildScheduledEvent,
// 				Partials.Message,
// 				Partials.Reaction,
// 				Partials.ThreadMember,
// 				Partials.User
// 			],
// 			allowedMentions: { parse: ['everyone', 'roles', 'users'] },
// 			makeCache: Options.cacheWithLimits({
// 				...Options.DefaultMakeCacheSettings,
// 				MessageManager: { maxSize: 200 }
// 			}),
// 			presence: { activities: [{ name: 'Im DragonBot', type: ActivityType.Custom, url: 'https://github.com/skullgaming31/DragonBot' }], afk: false, status: 'online' },
// 		});
// 	}
// 	async start() {
// 		const agent = new Agent({
// 			connect: {
// 				timeout: 300000
// 			}
// 		});

// 		this.rest.setAgent(agent);
// 		await this.registerModules();
// 		switch (process.env.Enviroment) {
// 			case 'dev':
// 			case 'debug':
// 				await this.login(process.env.DEV_DISCORD_BOT_TOKEN);
// 				break;
// 			case 'prod':
// 				await this.login(process.env.DISCORD_BOT_TOKEN);
// 				break;
// 		}
// 	}

// 	async importFile(filePath: string) { return (await import(filePath))?.default; }

// 	async registerCommands({ commands, guildId }: RegisterCommandOptions): Promise<void> {
// 		if (guildId) {
// 			const CommandsFetched = await this.guilds.cache.get(guildId)?.commands.fetch();
// 			const commandsList = await this.guilds.cache.get(guildId)?.commands.set(commands);
// 			console.log(`Commands Count: ${commandsList?.size}`);
// 			console.log(`Commands Fetched: ${CommandsFetched?.size}`);

// 			console.log(`Registering Commands to ${guildId}`);
// 		} else {
// 			const fetched = await this.application?.commands.fetch();
// 			const tbd = await this.application?.commands.set(commands);
// 			console.log(`Commands Fetched: ${fetched?.size}`);
// 			console.log(`Commands Count: ${tbd?.size}`);
// 			console.log('Registering Global commands');
// 		}
// 	}

// 	async registerModules() {
// 		//Commands
// 		const slashCommands: ApplicationCommandDataResolvable[] = [];
// 		const commandFiles = await PG(`${__dirname}/../Commands/*/*{.ts,.js}`, {});
// 		// console.log({ commandFiles });

// 		commandFiles.forEach(async (filePath: string) => {
// 			const command: CommandType = await this.importFile(filePath);

// 			if (!command.name) return;

// 			this.commands.set(command.name, command);
// 			slashCommands.push(command);
// 		});

// 		this.on('ready', () => {
// 			switch (process.env.Enviroment) {
// 				case 'dev':
// 					this.registerCommands({ commands: slashCommands, guildId: '959693430227894292' });
// 					console.log('Enviroment: ', process.env.Enviroment);
// 					break;
// 				case 'prod':
// 					this.registerCommands({ commands: slashCommands, guildId: undefined });
// 					console.log('Enviroment: ', process.env.Enviroment);
// 					break;
// 				default:
// 					console.log('Enviroment: ', process.env.Enviroment);
// 			}
// 		});

// 		//Event
// 		const eventFiles = await PG(`${__dirname}/../Events/*/*{.ts,.js}`);
// 		// console.log({ eventFiles });

// 		eventFiles.forEach(async (filePath: string) => {
// 			const event: Event<keyof ClientEvents> = await this.importFile(filePath);
// 			if (event.event === 'ready') { this.once(event.event, event.run); } else { this.on(event.event, event.run); }
// 		});
// 	}
// }

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
			],
			partials: [
				Partials.Channel,
				Partials.GuildMember,
				Partials.GuildScheduledEvent,
				Partials.Message,
				Partials.Reaction,
				Partials.ThreadMember,
				Partials.User
			],
			allowedMentions: { parse: ['everyone', 'roles', 'users'] },
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				MessageManager: { maxSize: 200 }
			}),
			presence: { activities: [{ name: 'Im DragonBot', type: ActivityType.Custom, url: 'https://github.com/skullgaming31/DragonBot' }], afk: false, status: 'online' },
		});
	}

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

		this.on('ready', () => {
			switch (process.env.Enviroment) {
				case 'dev':
					this.registerCommands({ commands: slashCommands, guildId: '959693430227894292' });
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
			if (event.event === 'ready') {
				this.once(event.event, event.run);
			} else {
				this.on(event.event, event.run);
			}
		});
	}
}