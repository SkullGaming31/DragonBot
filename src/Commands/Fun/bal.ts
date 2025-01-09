import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags, channelMention, userMention } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
    name: 'bal',
    description: 'Check the balance of your account or another user (if you have permission)',
    UserPerms: ['SendMessages'],
    BotPerms: ['SendMessages'],
    defaultMemberPermissions: ['SendMessages'],
    Category: 'Fun',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'target',
            description: 'Tag a user to check their balance (Moderator, Admin Only option)',
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    run: async ({ interaction }) => {
        try {
            const { user, options, guild, channel } = interaction;

            // Check if the user is attempting to check another user's balance
            const targetUser = options.getUser('target');

            // Use interaction.member directly to consistently represent the command user
            const commandUser = interaction.member;

            // Check if the command user is the server owner (no need for serverMember here)
            const isOwner = commandUser?.id === guild?.ownerId;

            const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });
            if (!settingsDoc) return interaction.reply({ content: 'Unable to retrieve server settings. Please run the `/settings` command.', flags: MessageFlags.Ephemeral });

            let economyChannel;
            if (settingsDoc.EconChan) {
                economyChannel = guild?.channels.cache.get(settingsDoc.EconChan);
            } else {
                // No economy channel set, use the command channel
                economyChannel = interaction.channel;
            }

            if (economyChannel && economyChannel.id !== channel?.id) {
                return interaction.reply({ content: `${userMention(user.id)}, You can only use this command in the economy channel ${channelMention(economyChannel.id)}`, flags: MessageFlags.Ephemeral });
            }

            // Check if the user is in the guild to access their roles
            if (targetUser && !guild) {
                console.log('Guild is missing'); // Debug log
                return interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
            }

            const adminRoleId = settingsDoc.AdministratorRole as string;
            const modRoleId = settingsDoc.ModeratorRole as string;

            // Check if the user has either role
            const hasPermission = isOwner || (commandUser?.roles.cache.has(adminRoleId) || commandUser?.roles.cache.has(modRoleId));

            if (targetUser && !hasPermission) {
                return interaction.reply({ content: 'You don\'t have permission to check other users\' balances.', flags: MessageFlags.Ephemeral });
            }

            // Find the user in the database (target user or the original user)
            const userId = targetUser?.id || user.id;
            const userDoc = await UserModel.findOne({ guildID: guild?.id, id: userId });

            if (!userDoc) {
                const message = `${targetUser ? userMention(targetUser.id) : 'You'} don't have an entry in the database yet. Use the \`/begin\` command to register!`;
                return interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
            }

            const targetUsername = targetUser ? targetUser.username : user.username;

            // Get all user balances, sorted by balance (descending)
            const allUserBalances = await UserModel.find({ guildID: guild?.id }).sort({ balance: -1 }).select('balance');
            // Get the rank of the current user's balance within the sorted list
            const userRank = allUserBalances.findIndex(doc => doc.balance === userDoc.balance) + 1;

            const embed = new EmbedBuilder()
                .setTitle(`${targetUsername}'s Account Stats`)
                .setColor('Green')
                .addFields([
                    {
                        name: 'Balance',
                        value: `${userDoc.balance || '0'} gold`, // Use "0" or a better default if balance is undefined
                        inline: true
                    },
                    {
                        name: 'Inventory',
                        value: `${userDoc.inventory?.length ? userDoc.inventory.join('\n') : 'Empty'}`, // Check length and join if exists, otherwise show "Empty"
                        inline: true
                    },
                    {
                        name: 'Rank',
                        value: `${userRank}`,
                        inline: true
                    }
                ])
                .setFooter({ text: `${guild?.name}` })
                .setTimestamp();

            if (targetUser) {
                embed.setThumbnail(targetUser.displayAvatarURL({ size: 512 }));
            } else {
                embed.setThumbnail(user.displayAvatarURL({ size: 512 }));
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching user balance:', error);
            await interaction.reply({ content: 'Oops! Something went wrong while checking the balance. Please try again later.', flags: MessageFlags.Ephemeral });
        }
    },
});