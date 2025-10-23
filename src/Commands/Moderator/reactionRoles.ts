import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, TextChannel, ChannelType } from 'discord.js';
import { Command } from '../../Structures/Command';
import ReactionRoleModel from '../../Database/Schemas/reactionRole';
import { tryReact } from '../../Utilities/retry';
import { createAndLogMapping } from '../../Utilities/reactionMapping';

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
				{ name: 'message_id', description: 'Message ID to attach the reaction role to', type: ApplicationCommandOptionType.String, required: false },
				// message_content moved to a separate subcommand `create_message` to make the UI explicit
				{ name: 'emoji', description: 'Emoji (unicode or custom like name:id)', type: ApplicationCommandOptionType.String, required: true },
				{ name: 'role', description: 'Role to assign', type: ApplicationCommandOptionType.Role, required: true },
				{ name: 'label', description: 'Optional label', type: ApplicationCommandOptionType.String, required: false },
			],
		},
		{
			name: 'cleanup',
			description: 'Run a one-off cleanup of stale reaction-role mappings (admin only)',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'mode', description: 'run (default) or status', type: ApplicationCommandOptionType.String, required: false },
			],
		},
		{
			name: 'create_message',
			description: 'Create a message in channel and attach a reaction role mapping',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'channel', description: 'Channel to post the message to', type: ApplicationCommandOptionType.Channel, required: true },
				{ name: 'message_content', description: 'Content to post', type: ApplicationCommandOptionType.String, required: true },
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
			const messageIdOption = interaction.options.getString('message_id', false);
			const messageId = messageIdOption ?? '';

			const emoji = interaction.options.getString('emoji', true);
			const role = interaction.options.getRole('role', true);
			const label = interaction.options.getString('label', false) ?? undefined;

			// Pre-check bot permissions in the target channel before proceeding
			try {
				const me = interaction.guild?.members?.me;
				const perms = me ? channel.permissionsFor(me) : null;
				// Only fail early when we have a permissions object and it explicitly lacks required perms.
				if (perms && typeof (perms as unknown as { has?: unknown }).has === 'function' && !(perms as unknown as { has: (p: unknown) => boolean }).has(['ViewChannel', 'ReadMessageHistory', 'AddReactions'])) {
					return interaction.reply({ content: 'I do not have sufficient permissions in the target channel (need View Channel, Read Message History, Add Reactions).', ephemeral: true });
				}
				// role hierarchy: bot must be higher than target role
				if (interaction.guild && me && role && (me.roles?.highest?.position ?? 0) <= (role?.position ?? 0)) {
					return interaction.reply({ content: 'I cannot assign that role because my role is not above the target role in the server role hierarchy.', ephemeral: true });
				}
			} catch (err) {
				// if permission checks throw, continue and let operations fail with clear error messages later
			}

			// If this was the create_message subcommand, the code below will handle creating the message

			// Permission/visibility checks (only enforce when host channel object exposes these properties)
			if (typeof (channel as unknown as { viewable?: unknown }).viewable === 'boolean' && !(channel as unknown as { viewable?: boolean }).viewable) {
				return interaction.reply({ content: 'I cannot view that channel. Check my channel permissions.', ephemeral: true });
			}
			if (typeof (channel as unknown as { permissionsFor?: unknown }).permissionsFor === 'function') {
				const perms = (channel as unknown as { permissionsFor: (u: unknown) => unknown }).permissionsFor(interaction.client.user!);
				if (perms && typeof (perms as unknown as { has?: unknown }).has === 'function' && !(perms as unknown as { has: (p: unknown) => boolean }).has('AddReactions')) {
					return interaction.reply({ content: 'I need the Add Reactions permission in the target channel to pre-populate the emoji.', ephemeral: true });
				}
			}

			const res = await createAndLogMapping({
				guild: interaction.guild!,
				guildId,
				channel,
				messageId,
				messageLike: undefined,
				emoji,
				roleId: role.id,
				label,
				actorId: interaction.user?.id,
			});

			if (res.existing) return interaction.reply({ content: 'This mapping already exists.', ephemeral: true });
			let replyMsg = `Created mapping with id ${res.doc._id}`;
			if (res.reactResult === 'missing_permissions') replyMsg += ' — I could not add the reaction because I lack permissions or access to the emoji.';
			return interaction.reply({ content: replyMsg, ephemeral: true });
		}

		if (sub === 'create_message') {
			const channel = interaction.options.getChannel('channel', true) as TextChannel;
			const messageContent = interaction.options.getString('message_content', true);
			const emoji = interaction.options.getString('emoji', true);
			const role = interaction.options.getRole('role', true);
			const label = interaction.options.getString('label', false) ?? undefined;

			// Pre-check bot permissions in the target channel before attempting to send
			try {
				const me = interaction.guild?.members?.me;
				const perms = me ? channel.permissionsFor(me) : null;
				// Only fail early when we have a permissions object and it explicitly lacks required perms.
				if (perms && typeof (perms as unknown as { has?: unknown }).has === 'function' && !(perms as unknown as { has: (p: unknown) => boolean }).has(['ViewChannel', 'SendMessages', 'AddReactions'])) {
					return interaction.reply({ content: 'I do not have sufficient permissions in the target channel (need View Channel, Send Messages, Add Reactions).', ephemeral: true });
				}
				if (interaction.guild && me && role && (me.roles?.highest?.position ?? 0) <= (role?.position ?? 0)) {
					return interaction.reply({ content: 'I cannot assign that role because my role is not above the target role in the server role hierarchy.', ephemeral: true });
				}
			} catch (err) {
				// ignore and continue to attempt send which will fail with a clear error
			}

			// Try to send the message. If send fails, abort and inform the user.
			let sentMessageId = '';
			let sentMessage: unknown = undefined;
			// Pre-flight permission checks before sending (only enforce when channel exposes checks)
			if (typeof (channel as unknown as { viewable?: unknown }).viewable === 'boolean' && !(channel as unknown as { viewable?: boolean }).viewable) {
				return interaction.reply({ content: 'I cannot view that channel. Check my channel permissions.', ephemeral: true });
			}
			if (typeof (channel as unknown as { permissionsFor?: unknown }).permissionsFor === 'function') {
				const perms = (channel as unknown as { permissionsFor: (u: unknown) => unknown }).permissionsFor(interaction.client.user!);
				if (perms && typeof (perms as unknown as { has?: unknown }).has === 'function' && !(perms as unknown as { has: (p: unknown) => boolean }).has('SendMessages')) {
					return interaction.reply({ content: 'I need Send Messages permission in the target channel to create the message.', ephemeral: true });
				}
			}

			try {
				const sent = await channel.send(String(messageContent));
				// Narrow to check id exists
				if (sent && typeof (sent as unknown as { id?: unknown }).id === 'string') {
					sentMessageId = (sent as unknown as { id: string }).id;
					sentMessage = sent;
				} else if (sent && 'id' in (sent as object)) {
					// fallback
					sentMessageId = String((sent as unknown as { id?: unknown }).id ?? '');
					sentMessage = sent;
				} else {
					throw new Error('Failed to determine sent message id');
				}
			} catch (err) {
				console.error('Failed to send message for create_message:', err);
				return interaction.reply({ content: 'Failed to send the message in the target channel. Ensure I have permission to send messages there.', ephemeral: true });
			}

			const res = await createAndLogMapping({
				guild: interaction.guild!,
				guildId,
				channel,
				messageId: sentMessageId,
				messageLike: sentMessage,
				emoji,
				roleId: role.id,
				label,
				actorId: interaction.user?.id,
			});

			if (res.existing) return interaction.reply({ content: 'This mapping already exists.', ephemeral: true });
			let replyMsg = `Created mapping with id ${res.doc._id}`;
			if (res.reactResult === 'missing_permissions') replyMsg += ' — I could not add the reaction because I lack permissions or access to the emoji.';
			return interaction.reply({ content: replyMsg, ephemeral: true });
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

		if (sub === 'cleanup') {
			// Ensure the invoker has ManageGuild or is allowed by UserPerms
			if (!interaction.memberPermissions?.has?.('ManageGuild')) {
				return interaction.reply({ content: 'You do not have permission to run cleanup.', ephemeral: true });
			}

			const mode = interaction.options.getString('mode', false) ?? 'run';

			if (mode === 'status') {
				// Show last cleanup stats for this guild
				try {
					const ReactionCleanupModel = (await import('../../Database/Schemas/reactionCleanupDB')).default;
					const doc = await ReactionCleanupModel.findOne({ Guild: guildId }).lean().catch(() => null);
					if (!doc) return interaction.reply({ content: 'No cleanup run recorded for this guild.', ephemeral: true });
					return interaction.reply({ content: `Last cleanup: ${doc.lastRunAt?.toISOString() ?? 'unknown'} — checked ${doc.lastChecked ?? 0}, removed ${doc.lastRemoved ?? 0}.`, ephemeral: true });
				} catch (err) {
					console.error('Failed to read cleanup status', err);
					return interaction.reply({ content: 'Failed to read cleanup status.', ephemeral: true });
				}
			}

			// Run a one-off cleanup and report results
			try {
				const { runReactionCleanup } = await import('../../Utilities/reactionCleanup');
				const result = await runReactionCleanup(interaction.client);
				return interaction.reply({ content: `Cleanup complete. Checked ${result?.checked ?? 0} mappings, removed ${result?.removed ?? 0}.`, ephemeral: true });
			} catch (err) {
				console.error('Cleanup failed', err);
				return interaction.reply({ content: 'Cleanup failed. Check logs for details.', ephemeral: true });
			}
		}

		if (sub === 'delete') {
			const id = interaction.options.getString('id', true);
			const removed = await ReactionRoleModel.findOneAndDelete({ guildId, _id: id });
			if (!removed) return interaction.reply({ content: 'Mapping not found.', ephemeral: true });

			// optional: log deletion to configured logs channel (best-effort; don't block reply)
			(async () => {
				try {
					const { sendGuildLog } = await import('../../Utilities/audit');
					const embed = new EmbedBuilder()
						.setTitle('Reaction Role Mapping Deleted')
						.setDescription(`Mapping ID: \`${removed._id}\` deleted by <@${interaction.user?.id}>`)
						.addFields([
							{ name: 'Channel', value: `<#${removed.channelId}>`, inline: true },
							{ name: 'Message ID', value: String(removed.messageId), inline: true },
							{ name: 'Emoji', value: removed.emoji, inline: true },
							{ name: 'Role', value: `<@&${removed.roleId}>`, inline: true },
						])
						.setTimestamp();

					await sendGuildLog(interaction.guild!, embed, removed.channelId).catch(() => null);
				} catch (err) {
					console.error('Failed to log reaction mapping deletion:', err);
				}
			})();

			return interaction.reply({ content: `Deleted mapping ${id}`, ephemeral: true });
		}
	},
});