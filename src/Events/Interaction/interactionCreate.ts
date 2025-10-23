import { CommandInteractionOptionResolver, EmbedBuilder, MessageFlags, RoleResolvable } from 'discord.js';
import SuggestionModel, { ISuggestion } from '../../Database/Schemas/SuggestDB';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { ExtendedInteraction } from '../../Typings/Command';
import { safeInteractionReply, setCooldown } from '../../Utilities/functions';
import { appInstance } from '../../index';
import { UserModel } from '../../Database/Schemas/userModel';

export default new Event<'interactionCreate'>('interactionCreate', async (interaction) => {
	const { guild, user } = interaction;
	const settings = await SettingsModel.findOne({ GuildID: guild?.id });

	// Handle chat input commands
	if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
		const client = appInstance.client;
		const commandName = interaction.commandName;
		const command = appInstance.client.commands.get(interaction.commandName);

		if (!command) {
			return interaction.reply({ content: 'You have used a non-existent command, please try another command', flags: MessageFlags.Ephemeral });
		}

		// console.log('[Interaction] executing command:', command.name, 'command object id:', command);
		try {
			await command.run({
				args: interaction.options as CommandInteractionOptionResolver,
				client,
				interaction: interaction as ExtendedInteraction
			});

			// Set cooldown after successful command execution
			if (command.Cooldown) {
				setCooldown(commandName, user.id, command.Cooldown);
			}
		} catch (err) {
			console.error(`Error executing command ${commandName}:`, err);
			try {
				if (!interaction.replied) {
					await interaction.reply({ content: 'An internal error occurred while executing this command.', flags: MessageFlags.Ephemeral });
				} else if (interaction.deferred) {
					await interaction.editReply({ content: 'An internal error occurred while executing this command.' });
				}
			} catch (replyErr) {
				console.error('Failed to send error reply to interaction:', replyErr);
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
				console.warn('Ignored Discord interaction error', errCode, e?.message ?? error);
				return;
			}
			console.error('Error handling interaction:', error);
			await safeInteractionReply(interaction, { content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
		}
	}
});