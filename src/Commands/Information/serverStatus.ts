import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';
import axios from 'axios';

export default new Command({
    name: 'server',
    nameLocalizations: {
        'en-US': 'server',
    },
    description: 'Manage and check the status of your Nitrado Server',
    descriptionLocalizations: {
        'en-US': 'Manage and check the status of your Nitrado Server',
    },
    UserPerms: ['SendMessages'],
    BotPerms: ['SendMessages'],
    defaultMemberPermissions: ['SendMessages'],
    options: [
        {
            name: 'status',
            description: 'Check the status of a Nitrado server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'gamename',
                    description: 'The game you want to check the status for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'start',
            description: 'Start a Nitrado server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'gamename',
                    description: 'The game you want to start the server for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'stop',
            description: 'Stop a Nitrado server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'gamename',
                    description: 'The game you want to stop the server for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
        {
            name: 'restart',
            description: 'Restart a Nitrado server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'gamename',
                    description: 'The game you want to restart the server for',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                },
            ],
        },
    ],
    type: ApplicationCommandType.ChatInput,

    run: async ({ interaction, client }) => {
      await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const gameName = interaction.options.getString('gamename');
        const token = process.env.NITRADO_LONGLIFE_TOKEN as string;

        try {
            if (subcommand === 'status') {
                // Fetch server details
                const response = await axios.get('https://api.nitrado.net/services', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const services = response.data.data.services;
                const server = services.find((s: any) => s.details.game.toLowerCase() === gameName?.toLowerCase());

                if (!server) {
                    return interaction.editReply({ content: `No server found for the game: ${gameName}` });
                }

                // Fetch player list
                const playerResponse = await axios.get(`https://api.nitrado.net/services/${server.id}/gameservers/games/players`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const players = playerResponse.data.data.players;
                const playerList = players.length > 0
                    ? players.map((p: any) => `${p.name} (ID: ${p.id}, Online: ${p.online})`).join('\n')
                    : 'No players online.';

                let statusMessage;
                switch (server.status) {
                    case 'active':
                        statusMessage = 'The server is currently **online** and usable.';
                        break;
                    case 'installing':
                        statusMessage = 'The server is currently **installing**. Please wait.';
                        break;
                    case 'suspended':
                        statusMessage = 'The server is **suspended**. It can be reactivated.';
                        break;
                    case 'adminlocked':
                        statusMessage = 'The server is **admin locked**. Please contact support.';
                        break;
                    case 'adminlocked_suspended':
                        statusMessage = 'The server is **admin locked and suspended**. Please contact support.';
                        break;
                    default:
                        statusMessage = 'The server status is unknown.';
                        break;
                }

                const statusEmbed = new EmbedBuilder()
                    .setTitle(`${server.details.name} Server Status`)
                    .setDescription(statusMessage)
                    .setColor(
                        server.status === 'active'
                            ? 0x00ff00 // Green if online
                            : server.status === 'installing'
                            ? 0xffff00 // Yellow if installing
                            : 0xff0000 // Red for other statuses
                    )
                    .addFields([
                        { name: 'Address', value: server.details.address, inline: true },
                        { name: 'Slots', value: server.details.slots.toString(), inline: true },
                        { name: 'Players', value: playerList, inline: false },
                    ])
                    .setTimestamp();

                await interaction.editReply({ embeds: [statusEmbed] });
            } else if (['start', 'stop', 'restart'].includes(subcommand)) {
                const server = await axios.get('https://api.nitrado.net/services', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const service = server.data.data.services.find((s: any) => s.details.game.toLowerCase() === gameName?.toLowerCase());

                if (!service) {
                    return interaction.editReply({ content: `No server found for the game: ${gameName}` });
                }

                const endpoint = subcommand === 'stop'
                    ? `https://api.nitrado.net/services/${service.id}/gameservers/stop`
                    : `https://api.nitrado.net/services/${service.id}/gameservers/restart`;

                await axios.post(endpoint, {}, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                });

                await interaction.editReply(`Server ${subcommand} command executed for game: ${gameName}`);
            } else {
                await interaction.editReply('Invalid subcommand. Use `/server status`, `/server start`, `/server stop`, or `/server restart`.');
            }
        } catch (error) {
            console.error('Error handling server command:', error);
            await interaction.editReply({ content: 'An error occurred while trying to process the server command.' });
        }
    },
});