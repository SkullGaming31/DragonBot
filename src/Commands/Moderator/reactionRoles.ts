import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, TextChannel } from 'discord.js';
import { Command } from '../../Structures/Command';
import ReactionRoleModel from '../../Database/Schemas/reactionRole';

export default new Command({
	name: 'reaction',
	description: 'Manage reaction role mappings',
	UserPerms: ['ManageGuild'],
	BotPerms: ['AddReactions'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'create',
			description: 'Create a reaction role mapping on an existing message',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'channel', description: 'Channel containing the message', type: ApplicationCommandOptionType.Channel, required: true },
				{ name: 'message_id', description: 'Message ID to attach the reaction role to', type: ApplicationCommandOptionType.String, required: true },
				{ name: 'emoji', description: 'Emoji (unicode or custom like name:id)', type: ApplicationCommandOptionType.String, required: true },
				{ name: 'role', description: 'Role to assign', type: ApplicationCommandOptionType.Role, required: true },
				{ name: 'label', description: 'Optional label', type: ApplicationCommandOptionType.String, required: false },
			],
		},
		{
			name: 'list',
			description: 'List reaction role mappings for this guild',
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: 'delete',
			description: 'Delete a reaction role mapping by ID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [{ name: 'id', description: 'Mapping _id to delete', type: ApplicationCommandOptionType.String, required: true }],
		},
	],
	run: async ({ interaction }) => {
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guild?.id;
		if (!guildId) return interaction.reply({ content: 'Guild not found.', ephemeral: true });

		if (sub === 'create') {
			const channel = interaction.options.getChannel('channel', true) as TextChannel;
			const messageId = interaction.options.getString('message_id', true);
			const emoji = interaction.options.getString('emoji', true);
			const role = interaction.options.getRole('role', true);
			const label = interaction.options.getString('label', false) ?? undefined;

			// persist mapping
			const existing = await ReactionRoleModel.findOne({ guildId, messageId, emoji, roleId: role.id });
			if (existing) return interaction.reply({ content: 'This mapping already exists.', ephemeral: true });

			const doc = await ReactionRoleModel.create({ guildId, channelId: channel.id, messageId, emoji, roleId: role.id, label });

			// react to message to ensure emoji is present (best effort)
			try {
				const msg = await channel.messages.fetch(messageId);
				// attempt to react (emoji could be custom; user must supply proper format)
				await msg.react(emoji).catch(() => null);
			} catch (err) {
				// ignore fetch/react errors
			}

			return interaction.reply({ content: `Created mapping with id ${doc._id}`, ephemeral: true });
		}

		if (sub === 'list') {
			const docs = await ReactionRoleModel.find({ guildId }).lean();
			if (!docs || docs.length === 0) return interaction.reply({ content: 'No reaction role mappings found for this guild.', ephemeral: true });

			const embed = new EmbedBuilder().setTitle('Reaction Role Mappings');
			for (const d of docs) {
				embed.addFields([{ name: String(d._id), value: `channel: <#${d.channelId}> message: ${d.messageId} emoji: ${d.emoji} role: <@&${d.roleId}> ${d.label ? `\n${d.label}` : ''}` }]);
			}

			return interaction.reply({ embeds: [embed], ephemeral: true });
		}

		if (sub === 'delete') {
			const id = interaction.options.getString('id', true);
			const removed = await ReactionRoleModel.findOneAndDelete({ guildId, _id: id });
			if (!removed) return interaction.reply({ content: 'Mapping not found.', ephemeral: true });
			return interaction.reply({ content: `Deleted mapping ${id}`, ephemeral: true });
		}
	},
});