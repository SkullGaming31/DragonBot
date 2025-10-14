import { CommandInteractionOptionResolver, EmbedBuilder, MessageFlags, RoleResolvable } from 'discord.js';
import SuggestionModel, { ISuggestion } from '../../Database/Schemas/SuggestDB';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { ExtendedInteraction } from '../../Typings/Command';
import { setCooldown } from '../../Utilities/functions';
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

	// Handle button interactions
	if (interaction.isButton()) {
		try {
			switch (interaction.customId) {
				case 'grab':
					break;
				case 'confirm_purge': {
					await interaction.deferUpdate();
					const result = await UserModel.updateMany({ guildID: interaction.guild?.id }, { $set: { balance: 0 } });
					const updatedCount = result.modifiedCount;
					await interaction.editReply({ content: `Successfully purged all user balances to 0. Total entries updated: ${updatedCount}`, components: [] });
					break;
				}

				case 'cancel_purge': {
					await interaction.deferUpdate();
					await interaction.editReply({ content: 'Purge action has been canceled.', components: [] });
					break;
				}

				case 'accept': {
					// Check if the interaction is in the "rules" channel
					const data = settings?.rulesChannel;
					const rulesChannelId = data;
					if (interaction.channelId !== rulesChannelId) return;

					// Get the role ID from settings
					const roleId: RoleResolvable | undefined = settings?.MemberRole;

					if (roleId) {
						const member = interaction.guild?.members.cache.get(user?.id);
						if (member) {
							const role = interaction.guild?.roles.cache.get(roleId);
							if (role) {
								if (member.roles.cache.has(roleId)) {
									try {
										await member.roles.remove(role);
										await interaction.reply({ content: 'Role removed successfully!', flags: MessageFlags.Ephemeral });
									} catch (error) {
										console.error('Error removing role:', error);
										await interaction.reply({ content: 'An error occurred while removing the role.', flags: MessageFlags.Ephemeral });
									}
								} else {
									try {
										await member.roles.add(role);
										await interaction.reply({ content: 'Role assigned successfully!', flags: MessageFlags.Ephemeral });
									} catch (error) {
										console.error('Error assigning role:', error);
										await interaction.reply({ content: 'An error occurred while assigning the role.', flags: MessageFlags.Ephemeral });
									}
								}
							} else {
								await interaction.reply({ content: 'Role not found in the server.', flags: MessageFlags.Ephemeral });
							}
						} else {
							await interaction.reply({ content: 'Member not found.', flags: MessageFlags.Ephemeral });
						}
					} else {
						const owner = await interaction.guild?.fetchOwner({ cache: true });
						if (user.id !== owner?.id) {
							await interaction.reply({ content: 'Role ID not found in settings. Please contact an ``Admin`` to assign the role.', flags: MessageFlags.Ephemeral });
						} else {
							await interaction.reply({ content: 'Role ID not found in settings. Please use the ``/settings`` command to set it', flags: MessageFlags.Ephemeral });
						}
					}
					break;
				}

				case 'sugges-accept':
				case 'sugges-decline': {
					const { customId, message } = interaction;
					const data = await SuggestionModel.findOne<ISuggestion>({ guildId: guild?.id, messageId: message.id });

					if (!data) {
						await interaction.reply({ content: 'No data found in the Database', flags: MessageFlags.Ephemeral });
						return;
					}

					const embed = message.embeds[0];
					if (!embed) return;

					switch (customId) {
						case 'sugges-accept': {
							embed.fields[2] = { name: 'Status: ', value: 'Accepted', inline: true };
							await message.edit({ embeds: [EmbedBuilder.from(embed).setColor('Green').setTimestamp()], components: [] });

							if (embed.fields[1].value === 'Discord' && embed.fields[2].value === 'Accepted') {
								await SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
							} else {
								await SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
							}

							await interaction.reply({ content: 'Suggestion Accepted', flags: MessageFlags.Ephemeral });
							break;
						}

						case 'sugges-decline': {
							embed.fields[2] = { name: 'Status: ', value: 'Declined', inline: true };
							await message.edit({ embeds: [EmbedBuilder.from(embed).setColor('Red').setTimestamp()], components: [] });

							if (embed.fields[2].value === 'Declined') {
								await SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
							}

							await interaction.reply({ content: 'Suggestion Declined', flags: MessageFlags.Ephemeral });
							break;
						}
					}
					break;
				}

				default: {
					// Unknown button: don't reply here so other listeners (ticket handlers, etc.) can handle it.
					return;
					// break; (unreachable)
				}
			}
		} catch (error) {
			// Handle certain Discord API interaction errors quietly: these commonly occur when
			// the interaction has expired (10062) or already acknowledged (40060).
			const errCode = (error as any)?.code;
			if (errCode === 10062 || errCode === 40060) {
				console.warn('Ignored Discord interaction error', errCode, (error as any)?.message ?? error);
				return;
			}
			console.error('Error handling interaction:', error);
			const fallbackMsg = { content: 'An error occurred while processing your request. Please try again later.', ephemeral: true };
			try {
				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply(fallbackMsg as any);
				} else if (interaction.deferred) {
					await interaction.editReply({ content: fallbackMsg.content });
				} else {
					// Already replied — try followUp, but catch if not allowed
					try {
						await interaction.followUp(fallbackMsg as any);
					} catch (followErr) {
						console.warn('followUp failed for interaction:', followErr);
						// Last resort: send message to the channel if possible
						if (interaction.channel && 'send' in interaction.channel) {
							try { await interaction.channel.send(fallbackMsg.content); } catch { /* ignore */ }
						}
					}
				}
			} catch (replyErr) {
				console.error('Failed to send error reply to interaction:', replyErr);
				// Fallback: send message in channel if available
				if (interaction.channel && 'send' in interaction.channel) {
					try { await interaction.channel.send(fallbackMsg.content); } catch { /* ignore */ }
				}
			}
		}
	}
});