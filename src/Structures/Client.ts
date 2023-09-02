import { ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Partials } from 'discord.js';
import glob from 'glob';
import { Agent } from 'undici';
import { promisify } from 'util';
const PG = promisify(glob);

import { CommandType } from '../Typings/Command';
import { RegisterCommandOptions } from '../Typings/client';
import { Dashboard } from '../dashboard';
import { Event } from './Event';

export class ExtendedClient extends Client {
	commands: Collection<string, CommandType> = new Collection();

	constructor() {
		super({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent
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
			allowedMentions: {
				parse: ['everyone', 'roles', 'users']
			}
		});
	}
	async start() {
		const agent = new Agent({
			connect: {
				timeout: 300000
			}
		});

		this.rest.setAgent(agent);
		this.registerModules();
		if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
			await this.login(process.env.DEV_DISCORD_BOT_TOKEN).then(() => {
				const dashboard = new Dashboard(this);
				dashboard.init();
			});
		} else {
			await this.login(process.env.DISCORD_BOT_TOKEN).then(() => {
				const dashboard = new Dashboard(this);
				dashboard.init();
			});
		}
	}

	async importFile(filePath: string) {
		return (await import(filePath))?.default;
	}

	async registerCommands({ commands, guildId }: RegisterCommandOptions): Promise<void> {
		if (guildId) {
			this.guilds.cache.get(guildId)?.commands.set(commands);
			console.log(`Registering commands to ${guildId}`);
		} else {
			this.application?.commands.set(commands);
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
			switch (process.env.Environment) {
				case 'debug':
				case 'dev':
					this.registerCommands({ commands: slashCommands, guildId: '959693430227894292' });
					break;
				default:
					this.registerCommands({ commands: slashCommands, guildId: undefined });
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