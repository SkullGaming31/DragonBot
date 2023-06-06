import { EmbedBuilder } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import SuggestionModel from '../../Structures/Schemas/SuggestDB';
import { MongooseError } from 'mongoose';

export default new Event('interactionCreate', async (interaction) => {
	if (!interaction.inCachedGuild() || !interaction.isButton()) return;

	if (!interaction.member.permissions.has('ManageMessages')) return interaction.reply({ content: 'you ``cannot`` use this button', ephemeral: true });
	const { guildId, customId, message } = interaction;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	SuggestionModel.findOne({ GuildID: guildId, MessageID: message.id }, async (err: MongooseError, data: any) => {
		if (err) throw err.message;
		if (!data) return interaction.reply({ content: 'No data found in the Database', ephemeral: true });

		const Embed = message.embeds[0];
		if (!Embed) return;

		switch (customId) {
		case 'sugges-accept': {
			Embed.fields[2] = { name: 'Status: ', value: 'Accepted', inline: true };
			await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor('Green')], components: [] });
			if (Embed.fields[2].value === 'sugges-accept') {
				console.log('Suggestion Accepted- uploading data to github');
			}

			interaction.reply({ content: 'Suggestion Accepted', ephemeral: true });
		}
			break;
		case 'sugges-decline': {
			Embed.fields[2] = { name: 'Status: ', value: 'Declined', inline: true };
			await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor('Red')], components: [] });
			if (Embed.fields[2].value === 'Declined') {
				SuggestionModel.deleteOne({ GuildID: guildId, MessageID: message.id });
				console.log('Suggestion Declined, Deleting from Database');
			}
			interaction.reply({ content: 'Suggestion Declined', ephemeral: true });
		}
			break;
		}
	});
	if (!SuggestionModel) return;
});