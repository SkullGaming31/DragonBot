import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
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
			await interaction.reply({ content: `There is no command with name \`${commandName}\`!`, flags: MessageFlags.Ephemeral });
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
				await interaction.reply({ content: `Command file not found for \`${command.name}\`.`, flags: MessageFlags.Ephemeral });
				return;
			}

			// Try clearing common require cache entries if present (works for CJS runtimes)
			try { delete require.cache[require.resolve(commandFilePath)]; } catch { }

			console.log('[Reload] resolved commandFilePath:', commandFilePath);

			// Load the module. For TypeScript runtime (ts-node) require() works best for .ts files.
			let newCommand: any;
			const ext = path.extname(commandFilePath).toLowerCase();
			if (ext === '.ts') {
				// Use require so ts-node's register handles TypeScript files
				try {
					const imported = require(commandFilePath);
					newCommand = imported?.default ?? imported;
				} catch (err) {
					console.error('Require failed for .ts file, falling back to dynamic import', err);
					const imported = await import(pathToFileURL(commandFilePath).href + `?update=${Date.now()}`);
					newCommand = imported?.default ?? imported;
				}
			} else {
				// For .js files use a proper file URL (works on Windows)
				const fileUrl = pathToFileURL(commandFilePath).href + `?update=${Date.now()}`;
				console.log('[Reload] importing via file URL:', fileUrl);
				const imported = await import(fileUrl);
				newCommand = imported?.default ?? imported;
			}

			if (!newCommand || !newCommand.name) {
				await interaction.reply({ content: `Reloaded module did not export a valid command.`, flags: MessageFlags.Ephemeral });
				return;
			}

			// Update in-memory command collection
			client.commands.set(newCommand.name, newCommand);

			// If dry-run, show the JSON that would be registered and skip REST calls
			if (dryRun) {
				const json = {
					name: newCommand.name,
					description: newCommand.description || 'No description',
					type: newCommand.type ?? 1,
					options: newCommand.options ?? []
				};
				await interaction.reply({ content: `Dry run - command JSON:\n\n\`\`\`json\n${JSON.stringify(json, null, 2)}\n\`\`\``, flags: MessageFlags.Ephemeral });
				return;
			}

			// Re-register the full command set with Discord so the updated command is applied
			// Build the ApplicationCommandData array from the in-memory commands collection
			const allCommands = Array.from(client.commands.values()).map((cmd: any) => ({
				name: cmd.name,
				description: cmd.description || 'No description',
				type: cmd.type ?? 1,
				options: cmd.options ?? [],
				defaultMemberPermissions: cmd.defaultMemberPermissions ?? undefined,
				nameLocalizations: cmd.nameLocalizations ?? undefined,
				descriptionLocalizations: cmd.descriptionLocalizations ?? undefined
			}));

			// Use the guild where the reload was invoked for fastest propagation. Fall back to env-configured dev guild if available.
			const targetGuildId = interaction.guildId ?? (process.env.Enviroment === 'dev' ? process.env.DEV_DISCORD_GUILD_ID : undefined);
			await client.registerCommands({
				commands: allCommands,
				guildId: targetGuildId
			});

			await interaction.reply({ content: `Command \`${newCommand.name}\` was reloaded and the command set was re-registered.`, flags: MessageFlags.Ephemeral });
		} catch (error) {
			console.error('Error reloading command:', error);
			if (error instanceof Error) {
				await interaction.reply({ content: `There was an error while reloading a command \`${command.name}\`. See logs.`, flags: MessageFlags.Ephemeral });
			}
		}
		// await interaction.reply({ content: `Command is currently under development`, flags: MessageFlags.Ephemeral });
	}
});