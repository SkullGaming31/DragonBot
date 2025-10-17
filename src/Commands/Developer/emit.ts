/* eslint-disable no-unused-vars */

import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Guild, MessageFlags, PermissionsBitField, Role, RoleFlagsBitField, SnowflakeUtil } from 'discord.js';
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
				// Emit the guildMemberUpdate event with a lightweight old/new member pair
				{
					// build minimal old/new member objects using interaction.member when available
					const guild = interaction.guild;
					const baseMember = (interaction.member ?? {}) as any;
					const oldMember = {
						...baseMember,
						nickname: (baseMember as any).nickname ?? null,
						roles: { cache: new Map(((baseMember as any).roles?.cache) ?? []) },
						user: (baseMember as any).user ?? { id: (baseMember as any).id ?? 'u-test', globalName: (baseMember as any).displayName ?? 'TestUser', displayAvatarURL: () => null },
						guild,
					} as any;
					const newMember = {
						...oldMember,
						nickname: ((oldMember.nickname ?? '') + '_edited') as any,
						roles: oldMember.roles,
					};
					client.emit('guildMemberUpdate', oldMember, newMember);
					await interaction.reply({ content: 'Emitted guildMemberUpdate with a simulated old/new member', flags: MessageFlags.Ephemeral });
				}
				break;
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
			case 'roleCreate': {
				if (!interaction.guild) return interaction.reply({
					content: 'This command only works in servers',
					flags: MessageFlags.Ephemeral
				});

				try {
					// Create mock role data
					const mockRoleData = {
						id: SnowflakeUtil.generate(),
						name: 'Test Role',
						color: 0x5865F2,
						permissions: '0',
						position: 1,
						managed: false,
						mentionable: true,
						hoist: false,
					};

					// Create partial role object
					const mockRole = {
						...mockRoleData,
						guild: interaction.guild,
						permissions: new PermissionsBitField(BigInt(mockRoleData.permissions)),
						createdTimestamp: Date.now(),
						editable: false,
						hexColor: '#5865F2',
						icon: null,
						unicodeEmoji: null,
						tags: [],
						comparePositionTo: () => 1,
						delete: () => Promise.resolve(mockRole),
						edit: () => Promise.resolve(mockRole),
						toJSON: () => mockRoleData,
						toString: () => `<@&${mockRoleData.id}>`
					} as unknown as Role;

					// Emit event with type assertion
					client.emit('roleCreate', mockRole);
					await interaction.reply({
						content: `✅ Emitted roleCreate event for ${mockRole.name}`,
						flags: MessageFlags.Ephemeral
					});
				} catch (error) {
					console.error('RoleCreate Test Error:', error);
					await interaction.reply({
						content: '❌ Failed to emit roleCreate event',
						flags: MessageFlags.Ephemeral
					});
				}
				break;
			}
			case 'roleDelete': {
				if (!interaction.guild) return interaction.reply({
					content: 'This command only works in servers',
					flags: MessageFlags.Ephemeral
				});

				try {
					const mockRole = createMockRole(interaction.guild);
					client.emit('roleDelete', mockRole);
					await interaction.reply({
						content: `✅ Emitted roleDelete event for ${mockRole.name}`,
						flags: MessageFlags.Ephemeral
					});
				} catch (error) {
					console.error('roleDelete Test Error:', error);
					await interaction.reply({
						content: '❌ Failed to emit roleDelete event',
						flags: MessageFlags.Ephemeral
					});
				}
				break;
			}
			// Updated roleUpdate case
			case 'roleUpdate': {
				try {
					// create two mock roles (old and new) using helper
					const oldRole = createMockRole(interaction.guild as Guild);
					const newRole = { ...oldRole, name: `${oldRole.name}_updated` } as Role;
					client.emit('roleUpdate', oldRole, newRole);
					await interaction.reply({ content: `✅ Emitted roleUpdate event for ${oldRole.name} -> ${newRole.name}`, flags: MessageFlags.Ephemeral });
				} catch (error) {
					console.error('roleUpdate Test Error:', error);
					await interaction.reply({ content: '❌ Failed to emit roleUpdate event', flags: MessageFlags.Ephemeral });
				}
				break;
			}

				function createMockRole(guild: Guild, id?: string): Role {
					const mockRoleData = {
						id: id || SnowflakeUtil.generate(),
						name: 'Test Role',
						color: 0x5865F2,
						permissions: '0',
						position: 1,
						managed: false,
						mentionable: false,
						hoist: false,
						icon: null,
						unicode_emoji: null,
						flags: 0
					};

					return {
						...mockRoleData,
						guild,
						createdTimestamp: Date.now(),
						createdAt: new Date(),
						editable: false,
						hexColor: '#5865F2',
						permissions: new PermissionsBitField(BigInt(mockRoleData.permissions)),
						comparePositionTo: function (this: Role, other: Role) {
							return this.position - other.position;
						},
						equals: function (this: Role, other: Role) {
							return this.id === other.id;
						},
						delete: function (this: Role) {
							return Promise.resolve(this);
						},
						edit: function (this: Role) {
							return Promise.resolve(this);
						},
						toJSON: () => mockRoleData,
						toString: () => `<@&${mockRoleData.id}>`,
						client: guild.client,
						tags: [],
						icon: null,
						unicodeEmoji: null,
						flags: new RoleFlagsBitField(0)
					} as unknown as Role;
				}
		}
	}
});
