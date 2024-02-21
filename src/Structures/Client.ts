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
				GatewayIntentBits.GuildMessageReactions
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
			presence: { activities: [{ name: 'Testing', type: ActivityType.Custom, url: 'https://twitch.tv/canadiendragon' }], afk: false, status: 'online' },
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
		if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
			await this.login(process.env.DEV_DISCORD_BOT_TOKEN);
		} else {
			await this.login(process.env.DISCORD_BOT_TOKEN);
		}
	}

	async importFile(filePath: string) { return (await import(filePath))?.default; }

	async registerCommands({ commands, guildId }: RegisterCommandOptions): Promise<void> {
		if (guildId) {
			this.guilds.cache.get(guildId)?.commands.set(commands);
			// const commands = await this.guilds.cache.get(guildId)?.commands.fetch();// trying to delete old commands
			// commands?.forEach((cmd) => {
			// 	this.guilds.cache.get(guildId)?.commands.delete(cmd.id);
			// 	console.log(`Deleting Command ${cmd.name} from ${cmd.guild?.id}, ApplicationID: ${cmd.applicationId}`);
			// });
			console.log(`Registering Commands to ${guildId}`);
		} else {
			// Testing for registering commands in new servers when the bot joins a new server
			setInterval(() => { this.application?.commands.set(commands); }, 30000);
			// console.log(commands);
			console.log('Registering Global commands');
		}
	}

	async registerModules() {
		//Commands
		const slashCommands: ApplicationCommandDataResolvable[] = [];
		const commandFiles = await PG(`${__dirname}/../Commands/*/*{.ts,.js}`);
		// console.log({ commandFiles });

		commandFiles.forEach(async (filePath) => {
			const command: CommandType = await this.importFile(filePath);

			if (!command.name) return;

			this.commands.set(command.name, command);
			slashCommands.push(command);
		});

		this.on('ready', () => {
			switch (process.env.Enviroment) {
				case 'dev':
					this.registerCommands({ commands: slashCommands, guildId: '1199589597668188200' });
					console.log('Enviroment: ', process.env.Enviroment);
					break;
				case 'prod':
					this.registerCommands({ commands: slashCommands, guildId: undefined });
					console.log('Enviroment: ', process.env.Enviroment);
					break;
				default:
					console.log('Enviroment: ', process.env.Enviroment);
			}
		});

		//Event
		const eventFiles = await PG(`${__dirname}/../Events/*/*{.ts,.js}`);
		// console.log({ eventFiles });

		eventFiles.forEach(async (filePath) => {
			const event: Event<keyof ClientEvents> = await this.importFile(filePath);
			if (event.event === 'ready') { this.once(event.event, event.run); } else { this.on(event.event, event.run); }
		});
	}
}