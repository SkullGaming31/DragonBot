import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import type { ApplicationCommandDataResolvable } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { Command } from '../../Structures/Command';
import { ExtendedClient } from '../../Structures/Client';

export default new Command({
	// ISSUE: Command is not outputting new command data ex. first ping outputs 3! alter the command in the code and change it to output 1! but still outputs 3!
	name: 'reload',
	description: 'Reloads command',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	Category: 'Utilities',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'command',
			description: 'the command to reload',
			type: ApplicationCommandOptionType.String,
			required: true
		}
		,
		{
			name: 'dry',
			description: 'show the command JSON that would be registered',
			type: ApplicationCommandOptionType.Boolean,
			required: false
		}
	],
	run: async ({ interaction }) => {
		const commandName = interaction.options.getString('command', true).toLowerCase();
		const dryRun = interaction.options.getBoolean('dry') ?? false;
		const client = interaction.client as ExtendedClient;
		const command = client.commands.get(commandName);

		if (!command) {
			await interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
			return;
		}

		try {
			// Build possible file paths for the command file (support .ts in dev and .js in dist)
			const tsPath = path.resolve(__dirname, `../../Commands/${command.Category}/${command.name}.ts`);
			const jsPath = path.resolve(__dirname, `../../Commands/${command.Category}/${command.name}.js`);
			let commandFilePath: string | null = null;
			if (fs.existsSync(tsPath)) commandFilePath = tsPath;
			else if (fs.existsSync(jsPath)) commandFilePath = jsPath;
			else {
				await interaction.reply({ content: `Command file not found for \`${command.name}\`.`, ephemeral: true });
				return;
			}

			// Try clearing common require cache entries if present (works for CJS runtimes)
			try { delete require.cache[require.resolve(commandFilePath)]; } catch { /* ignore if not present */ }

			console.log('[Reload] resolved commandFilePath:', commandFilePath);

			// Load the module. For TypeScript runtime (ts-node) require() works best for .ts files.
			type CommandLike = {
				name?: string;
				description?: string;
				type?: number;
				options?: unknown[];
				defaultMemberPermissions?: unknown;
				nameLocalizations?: unknown;
				descriptionLocalizations?: unknown;
				Category?: string;
			};

			let newCommandModule: unknown;
			const ext = path.extname(commandFilePath).toLowerCase();
			if (ext === '.ts') {
				// Use require so ts-node's register handles TypeScript files
				try {

					newCommandModule = require(commandFilePath);
				} catch (err) {
					console.error('Require failed for .ts file, falling back to dynamic import', err);
					const imported = await import(pathToFileURL(commandFilePath).href + `?update=${Date.now()}`);
					newCommandModule = imported;
				}
			} else {
				// For .js files use a proper file URL (works on Windows)
				const fileUrl = pathToFileURL(commandFilePath).href + `?update=${Date.now()}`;
				console.log('[Reload] importing via file URL:', fileUrl);
				const imported = await import(fileUrl);
				newCommandModule = imported;
			}

			const maybeModule = newCommandModule as unknown;
			const candidate: CommandLike = ((maybeModule as { default?: unknown }).default ?? maybeModule) as CommandLike;
			if (!candidate || !candidate.name) {
				await interaction.reply({ content: 'Reloaded module did not export a valid command.', ephemeral: true });
				return;
			}

			// Update in-memory command collection
			// candidate is validated above; cast to the internal Command type for storage
			client.commands.set(candidate.name as string, candidate as unknown as import('../../Typings/Command').CommandType);

			// If dry-run, show the JSON that would be registered and skip REST calls
			if (dryRun) {
				const json = {
					name: candidate.name,
					description: candidate.description ?? 'No description',
					type: candidate.type ?? 1,
					options: candidate.options ?? []
				};
				await interaction.reply({ content: `Dry run - command JSON:\n\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``, ephemeral: true });
				return;
			}

			// Re-register the full command set with Discord so the updated command is applied
			// Build the ApplicationCommandData array from the in-memory commands collection
			const allCommands = Array.from(client.commands.values()).map((cmd) => ({
				name: (cmd as CommandLike).name,
				description: (cmd as CommandLike).description ?? 'No description',
				type: (cmd as CommandLike).type ?? 1,
				options: (cmd as CommandLike).options ?? [],
				defaultMemberPermissions: (cmd as CommandLike).defaultMemberPermissions ?? undefined,
				nameLocalizations: (cmd as CommandLike).nameLocalizations ?? undefined,
				descriptionLocalizations: (cmd as CommandLike).descriptionLocalizations ?? undefined
			})) as unknown as ApplicationCommandDataResolvable[];

			// Use the guild where the reload was invoked for fastest propagation. Fall back to env-configured dev guild if available.
			const targetGuildId = interaction.guildId ?? (process.env.Enviroment === 'dev' ? process.env.DEV_DISCORD_GUILD_ID : undefined);
			await client.registerCommands({
				commands: allCommands,
				guildId: targetGuildId
			});

			await interaction.reply({ content: `Command \`${candidate.name}\` was reloaded and the command set was re-registered.`, ephemeral: true });
		} catch (error) {
			console.error('Error reloading command:', error);
			if (error instanceof Error) {
				await interaction.reply({ content: `There was an error while reloading a command \`${command.name}\`. See logs.`, ephemeral: true });
			}
		}
		// await interaction.reply({ content: `Command is currently under development`, flags: MessageFlags.Ephemeral });
	}
});