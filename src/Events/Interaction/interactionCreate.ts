import { CommandInteractionOptionResolver, MessageFlags } from 'discord.js';
// import SuggestionModel, { ISuggestion } from '../../Database/Schemas/SuggestDB';
// import SettingsModel from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { CommandType } from '../../Typings/Command';
import { ExtendedInteraction } from '../../Typings/Command';
import { safeInteractionReply, setCooldown } from '../../Utilities/functions';
import { appInstance } from '../../index';
import { error as logError, warn as logWarn } from '../../Utilities/logger';
import { recordCommandTimestamp } from '../../Utilities/metricsReporter';

export default new Event<'interactionCreate'>('interactionCreate', async (interaction) => {
	const { user } = interaction;
	// const settings = await SettingsModel.findOne({ GuildID: guild?.id });

	// Handle chat input commands
	if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
		const client = appInstance.client;
		const commandName = interaction.commandName;
		const command = appInstance.client.commands.get(interaction.commandName);

		if (!command) {
			return interaction.reply({ content: 'You have used a non-existent command, please try another command', flags: MessageFlags.Ephemeral });
		}

		// await logInfo(`[Interaction] executing command: ${command.name} command object id: {command}$`);
		try {
			await command.run({
				args: interaction.options as CommandInteractionOptionResolver,
				client,
				interaction: interaction as ExtendedInteraction
			});

			// record for metrics (include command category when available)
			try {
				const cmd = command as CommandType | undefined;
				recordCommandTimestamp(commandName, cmd?.Category);
			} catch { /* ignore */ }

			// Set cooldown after successful command execution
			if (command.Cooldown) {
				setCooldown(commandName, user.id, command.Cooldown);
			}
		} catch (err) {
			logError(`Error executing command ${commandName}:`, { error: (err as Error)?.message ?? err });
			try {
				// If the interaction was deferred, edit the deferred reply first. Otherwise send a reply.
				if (interaction.deferred) {
					await interaction.editReply({ content: 'An internal error occurred while executing this command.' });
				} else if (!interaction.replied) {
					await interaction.reply({ content: 'An internal error occurred while executing this command.', flags: MessageFlags.Ephemeral });
				}
			} catch (replyErr) {
				logError('Failed to send error reply to interaction:', { error: (replyErr as Error)?.message ?? replyErr });
			}
		}
	}

	// Handle button interactions by delegating to registered button handlers
	if (interaction.isButton()) {
		try {
			const btn = appInstance.client.buttons.get(interaction.customId);
			if (btn) {
				await btn.run({ client: appInstance.client, interaction });
				return;
			}
		} catch (error) {
			const e = error as unknown as { code?: number; message?: string };
			const errCode = e?.code;
			if (errCode === 10062 || errCode === 40060) {
				logWarn('Ignored Discord interaction error', { code: errCode, message: e?.message ?? String(error) });
				return;
			}
			logError('Error handling interaction:', { error: (error as Error)?.message ?? error });
			await safeInteractionReply(interaction, { content: 'An error occurred while processing your request. Please try again later.', flags: MessageFlags.Ephemeral });
		}
	}
});