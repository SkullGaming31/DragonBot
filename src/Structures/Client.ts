import { ActivityType, ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GatewayIntentBits, Options, Partials } from 'discord.js';
import { config } from 'dotenv';
import glob from 'glob';
import { Agent } from 'undici';
import { promisify } from 'util';
const PG = promisify(glob);
import fs from 'fs';
import path from 'path';

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
			presence: { activities: [{ name: 'Im DragonBot', type: ActivityType.Watching, url: 'https://github.com/skullgaming31/dragonbot' }], afk: false, status: 'online' },
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
		//#region Copy Files from src -> TFD_metadata
		if (process.env.Enviroment !== 'dev') {
			const sourceDir = './src/TFD_metadata';
			const destDir = './dist/TFD_metadata';

			// Check if the source directory exists
			if (fs.existsSync(sourceDir)) {
				// Ensure the destination directory exists
				if (!fs.existsSync(destDir)) {
					fs.mkdirSync(destDir, { recursive: true });
				}

				// Read the files in the source directory
				const files = fs.readdirSync(sourceDir);

				// Copy each file to the destination directory
				files.forEach((file) => {
					const sourceFile = path.join(sourceDir, file);
					const destFile = path.join(destDir, file);
					fs.copyFileSync(sourceFile, destFile);
				});

				console.log('Files copied successfully!');
			} else {
				console.log('Source directory does not exist.');
			}
		}
		//#endregion
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