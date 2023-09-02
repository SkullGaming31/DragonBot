/* eslint-disable no-case-declarations */
import { CommandInteractionOptionResolver, EmbedBuilder } from 'discord.js';
import { MongooseError } from 'mongoose';
import SuggestionModel, { ISuggestion } from '../../Database/Schemas/SuggestDB';
import { Event } from '../../Structures/Event';
import { ExtendedInteraction } from '../../Typings/Command';
import { client } from '../../index';


export default new Event<'interactionCreate'>('interactionCreate', async (interaction) => {
	//chat input commands
	if (interaction.isCommand()) {
		const command = client.commands.get(interaction.commandName);
		// console.log(command);
		if (!command) return interaction.reply({ content: 'You have used a non-existant command, please try another command', ephemeral: true });

		command.run({
			args: interaction.options as CommandInteractionOptionResolver,
			client,
			interaction: interaction as ExtendedInteraction
		});
	}
	if (interaction.isButton()) {
		switch (interaction.customId) {
			case 'accept':
				// Check if the interaction is in the "rules" channel
				const rulesChannelId = '1068285178738376736';
				if (interaction.channelId !== rulesChannelId) return;

				// Check if the button custom ID is 'accept'
				if (interaction.customId === 'accept') {
					// Assign the desired role to the user
					const roleId = '1068285177891131423';
					const member = interaction.guild?.members.cache.get(interaction.user.id);

					if (member && roleId) {
						const role = interaction.guild?.roles.cache.get(roleId);
						if (role && !member.roles.cache.has(roleId)) {
							try {
								await member.roles.add(role);
								await interaction.reply({ content: 'Role assigned successfully!', ephemeral: true });
							} catch (error) {
								console.error('Error assigning role:', error);
								await interaction.reply({ content: 'An error occurred while assigning the role.', ephemeral: true });
							}
						} else {
							await interaction.reply({ content: 'You already have the role!', ephemeral: true });
						}
					} else {
						await interaction.reply({ content: 'Role or member not found.', ephemeral: true });
					}
				}
				break;
			case 'sugges-accept':
			case 'sugges-decline':
				// Database functionality for suggestion buttons
				const { guild, customId, message } = interaction;
				SuggestionModel.findOne({ guildId: guild?.id, messageId: message.id }, async (err: MongooseError, data: ISuggestion | null) => {
					if (err) throw err.message;
					if (!data) return interaction.reply({ content: 'No data found in the Database', ephemeral: true });

					const Embed = message.embeds[0];
					if (!Embed) return;

					switch (customId) {
						case 'sugges-accept': {
							try {
								// Handle suggestion accept button
								Embed.fields[2] = { name: 'Status: ', value: 'Accepted', inline: true };
								await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor('Green').setTimestamp()], components: [] });

								if (Embed.fields[2].value === 'Accepted') {
									console.log('Suggestion Accepted - uploading data to github');
								}
								if (Embed.fields[1].value === 'Discord' && Embed.fields[2].value === 'Accepted') {
									await SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
								} else {
									SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
								}

								await interaction.reply({ content: 'Suggestion Accepted', ephemeral: true });

							} catch (error) {
								console.error('Error deleting from the database: ', error);
							}
						}
							break;
						case 'sugges-decline': {
							try {
								// Handle suggestion decline button
								Embed.fields[2] = { name: 'Status: ', value: 'Declined', inline: true };
								await message.edit({ embeds: [EmbedBuilder.from(Embed).setColor('Red').setTimestamp()], components: [] });
								if (Embed.fields[2].value === 'Declined') {
									SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
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
				break;
			default:
				// Handle unknown button interactions or do nothing
				interaction.reply({ content: `Unknown Button: ${interaction.customId}`, ephemeral: true });
				break;
		}
	}
});