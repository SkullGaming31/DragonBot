import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
    name: 'editpoints',
    description: 'Add, remove, or purge points from users',
    UserPerms: ['ManageMessages'],
    BotPerms: ['ManageMessages'],
    defaultMemberPermissions: ['ManageMessages'],
    Category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'add',
            description: 'Add points to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'target',
                    description: 'The target user to add points to',
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: 'amount',
                    description: 'The amount of points to add to the user',
                    type: ApplicationCommandOptionType.Number,
                    required: true
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove points from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'target',
                    description: 'The target user to remove points from',
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: 'amount',
                    description: 'The amount of points to remove from the user',
                    type: ApplicationCommandOptionType.Number,
                    required: true
                }
            ]
        },
        {
            name: 'purge',
            description: 'Purge all points from all users',
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async ({ interaction }) => {
        const { options, guild } = interaction;
        const subcommand = options.getSubcommand();
        const targetUser = options.getUser('target');
        const amount = options.getNumber('amount') ?? 0;

        // Validate targetUser
        if (subcommand === 'add' || subcommand === 'remove') {
            if (!targetUser) {
                console.error('Unexpected error: targetUser is null after non-null assertion.');
                return interaction.reply({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true });
            }

            // Validate amount
            if (amount === null || amount <= 0 || isNaN(amount)) {
                return interaction.reply({ content: 'Please enter a valid positive amount of points.', ephemeral: true });
            }

            // Check if the target user is a guild member
            const guildMember = guild?.members.cache.get(targetUser.id);
            if (!guildMember) {
                return interaction.reply({ content: 'The target user is not a member of this guild.', ephemeral: true });
            }
        }

        try {
            switch (subcommand) {
                case 'add':
                    let userToAdd = await UserModel.findOne({ guildID: guild?.id, id: targetUser?.id });
                    if (!userToAdd) {
                        userToAdd = new UserModel({
                            guildID: guild?.id,
                            id: targetUser?.id,
                            username: targetUser?.username,
                            balance: 0,
                            inventory: [],
                            cooldowns: {},
                            AFKmessage: '',
                            AFKstatus: null,
                        });
                    }

                    // Update the user's balance
                    userToAdd.balance += amount;
                    await userToAdd.save();

                    await interaction.reply({ content: `Successfully added ${amount} points to **${targetUser?.username}**'s balance.`, ephemeral: false });
                    break;

                case 'remove':
                    let userToRemove = await UserModel.findOne({ guildID: guild?.id, id: targetUser?.id });
                    if (!userToRemove) {
                        return interaction.reply({ content: 'The target user does not have an entry in the database.', ephemeral: true });
                    }

                    // Ensure the user has enough balance to remove the specified amount
                    if (userToRemove.balance < amount) {
                        return interaction.reply({ content: `You are trying to remove more points than the user has. Current balance: ${userToRemove.balance}`, ephemeral: true });
                    }

                    // Update the user's balance
                    userToRemove.balance -= amount;
                    await userToRemove.save();

                    await interaction.reply({ content: `Successfully removed ${amount} points from **${targetUser?.username}**'s balance.`, ephemeral: false });
                    break;

                case 'purge':
                    // Send a confirmation message with buttons
                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('confirm_purge')
                                .setLabel('Confirm Purge')
                                .setStyle(ButtonStyle.Danger),
                            new ButtonBuilder()
                                .setCustomId('cancel_purge')
                                .setLabel('Cancel')
                                .setStyle(ButtonStyle.Secondary)
                        );

                    await interaction.reply({
                        content: 'Are you sure you want to purge all points from all users? This action cannot be undone.',
                        components: [row],
                        ephemeral: true
                    });
                    break;

                default:
                    return interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });
            }
        } catch (error) {
            console.error(`Error handling points:`, error);
            await interaction.reply({ content: `An error occurred while processing the points. Please try again later.`, ephemeral: true });
        }
    },
});