import { ApplicationCommandDataResolvable, Client, ClientEvents, Collection, IntentsBitField, Partials } from "discord.js";
import ms from "ms";
import { CommandType } from "src/Typings/Command";
import glob from 'glob';
import { promisify } from 'util';

const PG = promisify(glob);
import { RegisterCommandOptions } from "src/Typings/client";
// import 'dotenv/config';
import { Event } from "./Event";

export class ExtendedClient extends Client {
	commands: Collection<string, CommandType> = new Collection();

	constructor() {
		super({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMessages,
				IntentsBitField.Flags.MessageContent
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
			},
			rest: { timeout: ms('5m') }
		});
	}
	start() {
		this.registerModules();
		this.login(process.env.DEV_DISCORD_BOT_TOKEN);
	}

	async importFile(filePath: string) {
		return (await import(filePath))?.default;
	}

	async registerCommands({ commands, guildId }: RegisterCommandOptions) {
		if (guildId) {
			this.guilds.cache.get(guildId)?.commands.set(commands);
			console.log(`Registering commands to ${guildId}`);
		} else {
			this.application?.commands.set(commands);
			console.log('Registering Global commands');
		}
	}
	async registerModules() {
		//Commands
		const slashCommands: ApplicationCommandDataResolvable[] = []
		const commandFiles = await PG(`${__dirname}/../Commands/*/*{.ts,.js}`);
		// console.log({ commandFiles });

		commandFiles.forEach(async (filePath) => {
			const command: CommandType = await this.importFile(filePath);

			if (!command.name) return;

			this.commands.set(command.name, command);
			slashCommands.push(command);
		});

		//Event
		const eventFiles = await PG(`${__dirname}/../Events/*{.ts,.js}`);
		// console.log({ eventFiles });

		eventFiles.forEach(async (filePath) => {
			const event: Event<keyof ClientEvents> = await this.importFile(filePath);
			this.on(event.event, event.run);
		});
	}
}