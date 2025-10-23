import { ApplicationCommandOptionType, ApplicationCommandType, ButtonStyle, ActionRowBuilder, ButtonBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../Structures/Command';
import { safeInteractionReply } from '../../Utilities/functions';
import { appInstance } from '../../index';
import { ButtonStyle as DJSButtonStyle } from 'discord.js';

export default new Command({
	name: 'testbutton',
	description: 'Create a test message with a button (developer)',
	UserPerms: ['Administrator'],
	defaultMemberPermissions: ['Administrator'],
	Category: 'Developer',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'customid',
			description: 'customId for the button (required)',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'label',
			description: 'Button label (optional)',
			type: ApplicationCommandOptionType.String,
			required: false,
		},
		{
			name: 'style',
			description: 'Button style',
			type: ApplicationCommandOptionType.String,
			required: false,
			choices: [
				{ name: 'Primary', value: 'Primary' },
				{ name: 'Secondary', value: 'Secondary' },
				{ name: 'Success', value: 'Success' },
				{ name: 'Danger', value: 'Danger' },
			]
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.isChatInputCommand()) return;
		const customId = interaction.options.getString('customid', true);
		// If label or style omitted, prefer defaults from a registered button handler
		const providedLabel = interaction.options.getString('label');
		const providedStyle = interaction.options.getString('style');
		const handler = appInstance.client.buttons.get(customId);
		const label = providedLabel ?? handler?.defaultLabel ?? 'Click';
		const styleStr = providedStyle ?? (handler?.defaultStyle ? (() => {
			// Map ButtonStyle enum member back to name string for choices
			switch (handler!.defaultStyle) {
				case DJSButtonStyle.Primary: return 'Primary';
				case DJSButtonStyle.Secondary: return 'Secondary';
				case DJSButtonStyle.Success: return 'Success';
				case DJSButtonStyle.Danger: return 'Danger';
				default: return 'Primary';
			}
		})() : 'Primary');

		const styleMap: Record<string, ButtonStyle> = {
			Primary: ButtonStyle.Primary,
			Secondary: ButtonStyle.Secondary,
			Success: ButtonStyle.Success,
			Danger: ButtonStyle.Danger,
		};

		const button = new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(styleMap[styleStr] ?? ButtonStyle.Primary);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

		try {
			// prefer TextChannel typing for sending; fallback to optional chaining
			await (interaction.channel as import('discord.js').TextChannel | undefined)?.send({ content: `Test button: ${customId}`, components: [row] });
			await safeInteractionReply(interaction, { content: `Sent test button with customId \`${customId}\``, ephemeral: true });
		} catch (err) {
			console.error('Failed to send test button:', err);
			await safeInteractionReply(interaction, { content: 'Failed to send test button. Check bot permissions and channel.', ephemeral: true });
		}
	}
});
