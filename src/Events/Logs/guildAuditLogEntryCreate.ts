 
import { ChannelType, EmbedBuilder, Guild, GuildAuditLogsEntry } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

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
		} catch (_err) {
			logError('guildAuditLogEntryCreate: failed to fetch logs channel', { err: String(_err) });
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
			{ name: 'Target', value: (target && typeof target === 'object' && 'id' in (target as object) ? (target as { id?: string }).id ?? 'Unknown' : 'Unknown'), inline: true }
		)
		.setDescription(reason ?? 'No reason provided')
		.setTimestamp();

	try {




		// _args is intentionally unused; typed for clarity
		const possibleSender = logsChannelObj as unknown as { send?: (..._args: unknown[]) => Promise<unknown> } | undefined;
		if (possibleSender && typeof possibleSender.send === 'function') {
			await possibleSender.send({ embeds: [embed] });
			info('guildAuditLogEntryCreate: logged audit entry', { guildId: guild.id, actionType: String(actionType) });
		} else {
			warn('guildAuditLogEntryCreate: logs channel has no send() method', { guildId: guild.id, logsChannelID });
		}
	} catch (_err) {
		logError('guildAuditLogEntryCreate: failed to send log message', { err: String(_err), guildId: guild.id });
	}
});