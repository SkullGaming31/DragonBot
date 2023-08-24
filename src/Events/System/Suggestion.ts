import { EmbedBuilder } from 'discord.js';
import { MongooseError } from 'mongoose';
import { Event } from '../../../src/Structures/Event';
import SuggestionModel, { ISuggestion } from '../../Database/Schemas/SuggestDB';

export default new Event('interactionCreate', async (interaction) => {
	if (!interaction.inCachedGuild() || !interaction.isButton()) return;

	if (!interaction.member.permissions.has('ManageMessages')) return interaction.reply({ content: 'you ``cannot`` use this button', ephemeral: true });
	const { guild, customId, message } = interaction;

	SuggestionModel.findOne({ guildId: guild.id, messageId: message.id }, async (err: MongooseError, data: ISuggestion | null) => {
		if (err) throw err.message;
		if (!data) return interaction.reply({ content: 'No data found in the Database', ephemeral: true });

		const Embed = message.embeds[0];
		if (!Embed) return;

		switch (customId) {
		case 'sugges-accept': {
			try {
				Embed.fields[2] = { name: 'Status: ', value: 'Accepted', inline: true };
				await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor('Green').setTimestamp()], components: [] });
				// console.log('Field 1 value:', Embed.fields[1].value);
				// console.log('Field 2 value:', Embed.fields[2].value);

				if (Embed.fields[2].value === 'Accepted') {
					console.log('Suggestion Accepted- uploading data to github');
				}
				if (Embed.fields[1].value === 'Discord' && Embed.fields[2].value === 'Accepted') {// if accepted and the type is discord
					await SuggestionModel.deleteOne({ guildId: guild.id, messageId: message.id });
				} else {
					SuggestionModel.deleteOne({ guildId: guild.id, messageId: message.id });
				}

				interaction.reply({ content: 'Suggestion Accepted', ephemeral: true });
				
			} catch (error) {
				console.error('Error deleting from the database: ', error);
			}
		}
			break;
		case 'sugges-decline': {
			try {
				Embed.fields[2] = { name: 'Status: ', value: 'Declined', inline: true };
				await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor('Red').setTimestamp()], components: [] });
				if (Embed.fields[2].value === 'Declined') {
					SuggestionModel.deleteOne({ guildId: guild.id, messageId: message.id });
					console.log('Suggestion Declined, Deleting from Database');
				}
				interaction.reply({ content: 'Suggestion Declined', ephemeral: true });
			} catch (error) {
				console.error(error);
			}
		}
			break;
		}
	});
	if (!SuggestionModel) return;
});