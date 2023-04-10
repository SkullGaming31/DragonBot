import { ChannelType, EmbedBuilder, Guild, GuildAuditLogsEntry, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';

export default new Event<'guildAuditLogEntryCreate'>('guildAuditLogEntryCreate', async (auditLogEntry: GuildAuditLogsEntry, guild: Guild) => {

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder().setDescription('Not Implemented Yet');

	await logsChannelObj.send({ embeds: [embed] });
});