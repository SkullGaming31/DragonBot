import { EmbedBuilder, Colors, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, ButtonInteraction } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/SuggestDB';

export default new Event('interactionCreate', async (interaction) => {
    if (!interaction.inCachedGuild()) return;
	if (!interaction.isButton()) return;

		if (!interaction.member.permissions.has('ManageMessages')) return interaction.reply({ content: 'you ``cannot`` use this button', ephemeral: true });
		const { guildId, customId, message } = interaction;

		DB.findOne({ GuildID: guildId, MessageID: message.id }, async (err: any, data: any) => {
			if (err) throw err;
			if (!data) return interaction.reply({ content: 'No data found in the Database', ephemeral: true });

			const Embed = message.embeds[0];
			if (!Embed) return;

			switch (customId) {
				case 'sugges-accept': {
					Embed.fields[2] = { name: 'Status: ', value: 'Accepted', inline: true };
					await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor(Colors.Green)], components: [] });

					interaction.reply({ content: 'Suggestion Accepted', ephemeral: true });
				}
					break;
				case 'sugges-decline': {
					Embed.fields[2] = { name: 'Status: ', value: 'Declined', inline: true };
					await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor(Colors.Red)], components: [] });
					if (Embed.fields[2].value === 'Declined') {
						DB.deleteOne({ GuildID: guildId, MessageID: message.id });
						console.log('Suggestion Declined, Deleting from Database');
					}
					interaction.reply({ content: 'Suggestion Declined', ephemeral: true });
				}
					break;
			}
		});
		if (!DB) return;
});