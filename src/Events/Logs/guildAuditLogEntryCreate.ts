import { ChannelType, EmbedBuilder, Guild, GuildAuditLogsEntry, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

/* eslint-disable @typescript-eslint/no-explicit-any -- quickfix: replace anys with proper types later */
export default new Event<'guildAuditLogEntryCreate'>('guildAuditLogEntryCreate', async (auditLogEntry: GuildAuditLogsEntry, guild: Guild) => {
	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('guildAuditLogEntryCreate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	let logsChannelObj = guild.channels.cache.get(logsChannelID);
	if (!logsChannelObj) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelObj = fetched ?? undefined;
		} catch (err) {
			logError('guildAuditLogEntryCreate: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) {
		warn('guildAuditLogEntryCreate: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const { actionType, executor, target, reason } = auditLogEntry;

	const embed = new EmbedBuilder()
		.setTitle('Audit log entry')
		.addFields(
			{ name: 'Action', value: String(actionType), inline: true },
			{ name: 'By', value: (executor && executor.tag) || 'Unknown', inline: true },
			{ name: 'Target', value: (target && 'id' in (target as any) ? (target as any).id : 'Unknown'), inline: true }
		)
		.setDescription(reason ?? 'No reason provided')
		.setTimestamp();

	try {
		if ('send' in (logsChannelObj as any) && typeof (logsChannelObj as any).send === 'function') {
			await (logsChannelObj as any).send({ embeds: [embed] });
			info('guildAuditLogEntryCreate: logged audit entry', { guildId: guild.id, actionType: String(actionType) });
		} else {
			warn('guildAuditLogEntryCreate: logs channel has no send() method', { guildId: guild.id, logsChannelID });
		}
	} catch (err) {
		logError('guildAuditLogEntryCreate: failed to send log message', { err: String(err), guildId: guild.id });
	}
});