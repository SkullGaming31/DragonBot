import { CommandInteractionOptionResolver, ButtonBuilder, ButtonStyle, ActionRowBuilder, EmbedBuilder, RoleResolvable } from 'discord.js';
import { MongooseError } from 'mongoose';
import SuggestionModel, { ISuggestion } from '../../Database/Schemas/SuggestDB';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { ExtendedInteraction } from '../../Typings/Command';
import { setCooldown } from '../../Utilities/functions';
import { client } from '../../index';
import { UserModel } from '../../Database/Schemas/userModel';

export default new Event<'interactionCreate'>('interactionCreate', async (interaction) => {
    const { guild, user } = interaction;
    const settings = await SettingsModel.findOne({ GuildID: guild?.id });

    // Handle chat input commands
    if (interaction.isCommand()) {
        const commandName = interaction.commandName;
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({ content: 'You have used a non-existent command, please try another command', ephemeral: true });
        }

        await command.run({
            args: interaction.options as CommandInteractionOptionResolver,
            client,
            interaction: interaction as ExtendedInteraction
        });

        // Set cooldown after successful command execution
        if (command.Cooldown) {
            setCooldown(commandName, user.id, command.Cooldown);
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        try {
            switch (interaction.customId) {
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
                                        await interaction.reply({ content: 'Role removed successfully!', ephemeral: true });
                                    } catch (error) {
                                        console.error('Error removing role:', error);
                                        await interaction.reply({ content: 'An error occurred while removing the role.', ephemeral: true });
                                    }
                                } else {
                                    try {
                                        await member.roles.add(role);
                                        await interaction.reply({ content: 'Role assigned successfully!', ephemeral: true });
                                    } catch (error) {
                                        console.error('Error assigning role:', error);
                                        await interaction.reply({ content: 'An error occurred while assigning the role.', ephemeral: true });
                                    }
                                }
                            } else {
                                await interaction.reply({ content: 'Role not found in the server.', ephemeral: true });
                            }
                        } else {
                            await interaction.reply({ content: 'Member not found.', ephemeral: true });
                        }
                    } else {
                        const owner = await interaction.guild?.fetchOwner({ cache: true });
                        if (user.id !== owner?.id) {
                            await interaction.reply({ content: 'Role ID not found in settings. Please contact an ``Admin`` to assign the role.', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'Role ID not found in settings. Please use the ``/settings`` command to set it', ephemeral: true });
                        }
                    }
                    break;
                }

                case 'sugges-accept':
                case 'sugges-decline': {
                    const { customId, message } = interaction;
                    const data = await SuggestionModel.findOne({ guildId: guild?.id, messageId: message.id });

                    if (!data) {
                        await interaction.reply({ content: 'No data found in the Database', ephemeral: true });
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

                            await interaction.reply({ content: 'Suggestion Accepted', ephemeral: true });
                            break;
                        }

                        case 'sugges-decline': {
                            embed.fields[2] = { name: 'Status: ', value: 'Declined', inline: true };
                            await message.edit({ embeds: [EmbedBuilder.from(embed).setColor('Red').setTimestamp()], components: [] });

                            if (embed.fields[2].value === 'Declined') {
                                await SuggestionModel.deleteOne({ guildId: guild?.id, messageId: message.id });
                            }

                            await interaction.reply({ content: 'Suggestion Declined', ephemeral: true });
                            break;
                        }
                    }
                    break;
                }

                default: {
                    await interaction.reply({ content: `Unknown Button: ${interaction.customId}`, ephemeral: true });
                    break;
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'An error occurred while processing your request. Please try again later.', ephemeral: true });
            } else if (interaction.deferred) {
                await interaction.editReply({ content: 'An error occurred while processing your request. Please try again later.' });
            }
        }
    }
});