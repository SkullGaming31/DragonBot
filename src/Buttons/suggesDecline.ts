import { ButtonType } from '../Typings/Button';
import { EmbedBuilder, MessageFlags, ButtonStyle, APIEmbedField } from 'discord.js';
import SuggestionModel, { ISuggestion } from '../Database/Schemas/SuggestDB';

const handler: ButtonType = {
	customId: 'sugges-decline',
	defaultLabel: 'Decline',
	defaultStyle: ButtonStyle.Danger,
	run: async ({ interaction }) => {
		const { message, guild } = interaction;
		if (!message) return;

		const data = await SuggestionModel.findOne<ISuggestion>({ guildId: guild?.id, messageId: message.id });
		if (!data) {
			await interaction.reply({ content: 'No data found in the Database', flags: MessageFlags.Ephemeral });
			return;
		}

		const embed = message.embeds[0];
		if (!embed) return;

		const fields = Array.isArray(embed.fields) ? (embed.fields.slice() as APIEmbedField[]) : [];
		let statusIndex = fields.findIndex(f => typeof f.name === 'string' && f.name.toLowerCase().includes('status'));
		if (statusIndex === -1) statusIndex = 2;
		fields[statusIndex] = { name: 'Status: ', value: 'Declined', inline: true } as APIEmbedField;

		try {
			await message.edit({ embeds: [EmbedBuilder.from(embed).setFields(fields).setColor('Red').setTimestamp()], components: [] });
		} catch (err) {
			console.error('Failed to edit suggestion message on decline:', err);
		}

		await SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id }).catch(() => null);
		await interaction.reply({ content: 'Suggestion Declined', flags: MessageFlags.Ephemeral });
	}
};

export default handler;
