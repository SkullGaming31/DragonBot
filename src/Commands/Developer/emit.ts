/* eslint-disable no-case-declarations */
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, MessageFlags } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'emit',
	description: 'Emit an Event for testing',
	UserPerms: ['Administrator'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['Administrator'],
	Category: 'Developer',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'event',
			description: 'Guild Member Events',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'guildMemberAdd', value: 'guildMemberAdd' },
				{ name: 'guildMemberRemove', value: 'guildMemberRemove' },
				{ name: 'guildMemberUpdate', value: 'guildMemberUpdate' },
				{ name: 'guildCreate', value: 'guildCreate' },
				{ name: 'guildDelete', value: 'guildDelete' },
				{ name: 'channelCreate', value: 'channelCreate' },
				{ name: 'channelDelete', value: 'channelDelete' },
				{ name: 'channelUpdate', value: 'channelUpdate' },
				{ name: 'roleCreate', value: 'roleCreate' },
				{ name: 'roleDelete', value: 'roleDelete' },
				{ name: 'roleUpdate', value: 'roleUpdate' },
			]
		}
	],
	run: async ({ interaction, client }) => {
		if (!interaction.isChatInputCommand()) return;
		const { options, member, guild } = interaction;
		const choices = options.getString('event');

		if (guild?.id !== '959693430227894292' && guild?.id !== '1241597448690864169') return interaction.reply({ content: 'This is a development Only Command', flags: MessageFlags.Ephemeral });

		switch (choices) {
			case 'guildMemberAdd':
				client.emit('guildMemberAdd', member);
				await interaction.reply({ content: 'Emitted the event!', flags: MessageFlags.Ephemeral });
				break;
			case 'guildMemberRemove':
				client.emit('guildMemberRemove', member);
				await interaction.reply({ content: 'Emitted the event!', flags: MessageFlags.Ephemeral });
				break;
			case 'guildMemberUpdate':
				// Emit the guildMemberUpdate event with the simulated data
				client.emit('guildMemberUpdate', member, member);
				await interaction.reply({ content: 'Dont Know how to do this command!', flags: MessageFlags.Ephemeral });
				break;
			case 'guildCreate':
				if (guild) {
					client.emit('guildCreate', guild);
					await interaction.reply({ content: 'Event emitted!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Guild is null.', flags: MessageFlags.Ephemeral });
				}
				break;
			case 'guildDelete':
				if (guild) {
					client.emit('guildDelete', guild);
					await interaction.reply({ content: 'Event Emitted!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Guild is null.', flags: MessageFlags.Ephemeral });
				}
				break;
			case 'channelCreate':
				if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
					const channel = interaction.channel;
					client.emit('channelCreate', channel);
					await interaction.reply({ content: 'Event emitted!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Channel is null or not a text channel.', flags: MessageFlags.Ephemeral });
				}
				break;
			case 'channelUpdate':
				if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
					const channel = interaction.channel;
					client.emit('channelUpdate', channel, channel);
					await interaction.reply({ content: 'Event emitted!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Channel is null or not a text channel.', flags: MessageFlags.Ephemeral });
				}
				break;
			case 'channelDelete':
				if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
					const channel = interaction.channel;
					client.emit('channelDelete', channel);
					await interaction.reply({ content: 'Event emitted!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Channel is null or not a text channel.', flags: MessageFlags.Ephemeral });
				}
				break;
			case 'roleCreate':// dont know how to use this to test role create event
				interaction.reply({ content: 'Not Currently Implemented', flags: MessageFlags.Ephemeral });
				break;
			case 'roleDelete':// dont know how to use this to test role delete event
				interaction.reply({ content: 'Not Currently Implemented', flags: MessageFlags.Ephemeral });
				break;
			case 'roleUpdate':// dont know how to use this to test role update event
				interaction.reply({ content: 'Not Currently Implemented', flags: MessageFlags.Ephemeral });
				break;
		}
	}
});
