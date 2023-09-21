import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'emit',
	description: 'Emit an Event for testing',
	UserPerms: ['Administrator'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['Administrator'],
	type: ApplicationCommandType.ChatInput,
	Development: true,
	options: [
		{
			name: 'event',
			description: 'Guild Member Events',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'guildMemberAdd',
					value: 'guildMemberAdd',
				},
				{
					name: 'guildMemberRemove',
					value: 'guildMemberRemove'
				},
				{
					name: 'guildMemberUpdate',
					value: 'guildMemberUpdate'
				},
				{
					name: 'guildCreate',
					value: 'guildCreate'
				},
				{
					name: 'guildDelete',
					value: 'guildDelete'
				},
				{
					name: 'channelCreate',
					value: 'channelCreate'
				},
				{
					name: 'channelDelete',
					value: 'channelDelete'
				},
				{
					name: 'channelUpdate',
					value: 'channelUpdate'
				}
			]
		}
	],
	run: async ({ interaction, client }) => {
		if (!interaction.isChatInputCommand()) return;
		const { options, member, guild } = interaction;
		const choices = options.getString('event');

		if (guild?.id !== '959693430227894292') return interaction.reply({ content: 'This is a development Only Command', ephemeral: true });

		switch (choices) {
			case 'guildMemberAdd':
				client.emit('guildMemberAdd', member);
				await interaction.reply({ content: 'Emitted the event!', ephemeral: true });
				break;
			case 'guildMemberRemove':
				client.emit('guildMemberRemove', member);
				await interaction.reply({ content: 'Emitted the event!', ephemeral: true });
				break;
			case 'guildMemberUpdate':
				client.emit('guildMemberUpdate', member, member);
				await interaction.reply({ content: 'Event Emitted!', ephemeral: true });
				break;
			case 'guildCreate':
				if (guild) {
					client.emit('guildCreate', guild);
					await interaction.reply({ content: 'Event emitted!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Guild is null.', ephemeral: true });
				}
				break;
			case 'guildDelete':
				if (guild) {
					client.emit('guildDelete', guild);
					await interaction.reply({ content: 'Event Emitted!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Guild is null.', ephemeral: true });
				}
				break;
			case 'channelCreate':
				if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
					const channel = interaction.channel;
					client.emit('channelCreate', channel);
					await interaction.reply({ content: 'Event emitted!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Channel is null or not a text channel.', ephemeral: true });
				}
				break;
			case 'channelUpdate':
				if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
					const channel = interaction.channel;
					client.emit('channelUpdate', channel, channel);
					await interaction.reply({ content: 'Event emitted!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Channel is null or not a text channel.', ephemeral: true });
				}
				break;
			case 'channelDelete':
				if (interaction.channel && interaction.channel.type === ChannelType.GuildText) {
					const channel = interaction.channel;
					client.emit('channelDelete', channel);
					await interaction.reply({ content: 'Event emitted!', ephemeral: true });
				} else {
					await interaction.reply({ content: 'Cannot emit event. Channel is null or not a text channel.', ephemeral: true });
				}
				break;
		}
	}
});