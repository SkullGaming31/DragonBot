import { ChannelType, EmbedBuilder, Message, PartialMessage, TextBasedChannel, User } from 'discord.js';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import ReactionRoleModel from '../../Database/Schemas/reactionRole';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'messageDelete'>('messageDelete', async (message: Message | PartialMessage) => {
	if (!message.guild) return;

	const guild = message.guild;
	const author = (message as Message).author ?? undefined;
	const channel = message.channel ?? undefined;

	// Cleanup reaction-role mappings that referenced this message (best-effort)
	try {
		if ((message as Message).id) {
			const deleted = await ReactionRoleModel.deleteMany({ guildId: guild.id, messageId: (message as Message).id }) as { deletedCount?: number } | null;
			if (deleted && typeof deleted.deletedCount === 'number' && deleted.deletedCount > 0) {
				logInfo('messageDelete: removed stale reaction-role mappings', { guildId: guild.id, messageId: (message as Message).id, deleted: deleted.deletedCount });
			}
		}
	} catch (err) {
		logError('messageDelete: failed to cleanup reaction-role mappings', { error: (err as Error)?.message ?? String(err), guildId: guild.id, messageId: (message as Message).id });
	}

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (_err) {
		logError('messageDelete: failed to read LogsChannelDB', { error: (_err as Error)?.message ?? _err });
		return;
	}

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;
	if (channel?.id === data.Channel) return;

	// Get the message content or use 'None' if it's empty or undefined
	const messageContent = (message as Message | PartialMessage).content || 'None';

	// Get the author's name (including discriminator for users, tag for bots)
	const authorUser = author as User | undefined;
	const authorName = authorUser?.bot ? authorUser.tag : (authorUser?.globalName ?? authorUser?.username ?? 'Unknown');

	// Truncate the message content to fit within Discord's embed field limit
	const truncatedContent = String(messageContent).slice(0, 1024); // Truncate to 1024 characters

	const logsEmbed = new EmbedBuilder()
		.setTitle('Discord Event[messageDelete]')
		.setAuthor({ name: authorName })
		.setColor('Red')
		.addFields([
			{ name: 'User', value: authorName },
			{ name: '\ud83d\udea8 | Deleted Message: ', value: truncatedContent },
			{ name: 'Channel', value: `${channel}` },
		])
		.setFooter({ text: `UserID: ${authorUser?.id ?? 'Unknown'}` })
		.setTimestamp();

	// set URL only when available
	const messageUrl = (message as Message).url;
	if (typeof messageUrl === 'string') logsEmbed.setURL(messageUrl);

	if ((message as Message).attachments && (message as Message).attachments.size >= 1) {
		try {
			logsEmbed.addFields({ name: 'Attachments:', value: `${(message as Message).attachments.map((a) => a.url)}`, inline: true });
		} catch { /* ignore attachment rendering errors */ }
	}



	// second best-effort cleanup (if any remain)
	try {
		const deleted = await ReactionRoleModel.deleteMany({ guildId: guild.id, messageId: (message as Message).id }) as { deletedCount?: number } | null;
		if (deleted && typeof deleted.deletedCount === 'number' && deleted.deletedCount > 0) {
			logInfo('messageDelete: removed stale reaction-role mappings', { guildId: guild.id, messageId: (message as Message).id, deleted: deleted.deletedCount });
		}
	} catch (err) {
		logError('messageDelete: failed to cleanup reaction-role mappings', { error: (err as Error)?.message ?? String(err), guildId: guild.id, messageId: (message as Message).id });
	}

	try {
		const { sendGuildLog } = await import('../../Utilities/audit');
		const sent = await sendGuildLog(guild, logsEmbed, channel?.id);
		if (sent) logInfo('messageDelete: sent delete log', { guild: guild.id, channel: channel?.id, author: authorUser?.id });
	} catch (err) {
		logError('messageDelete: failed to send embed', { error: (err as Error)?.message ?? err });
	}
});