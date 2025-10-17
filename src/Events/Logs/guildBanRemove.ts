import { ChannelType, EmbedBuilder, GuildBan, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildBanRemove'>('guildBanRemove', async (ban: GuildBan) => {
	const { guild, user } = ban;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('guildBanRemove: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
		return;
	}

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setTitle('User UnBanned')
		.setDescription(`\`${user?.globalName ?? user?.username ?? 'Unknown'}\` (${user?.id ?? 'Unknown'}) has been removed from the ban list for this server`)
		.setColor('Green')
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
		logInfo('guildBanRemove: sent unban log', { guild: guild.id, user: user?.id });
	} catch (error) {
		logError('guildBanRemove: failed to send embed', { error: (error as Error)?.message ?? error });
	}
});