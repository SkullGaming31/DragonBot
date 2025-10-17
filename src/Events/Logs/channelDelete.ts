import { ChannelType, DMChannel, EmbedBuilder, GuildChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { warn, error as logError, info } from '../../Utilities/logger';

export default new Event<'channelDelete'>('channelDelete', async (channel: GuildChannel | DMChannel) => {
	if (channel.isDMBased()) return;

	const { guild, name, id } = channel as GuildChannel;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('channelDelete: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	// Try cache first then fetch as fallback
	let logChannelObj = guild.channels.cache.get(logsChannelID);
	if (!logChannelObj) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logChannelObj = fetched ?? undefined;
		} catch (err) {
			logError('channelDelete: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logChannelObj || logChannelObj.type !== ChannelType.GuildText) {
		warn('channelDelete: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle('Channel deleted')
		.addFields(
			{ name: 'Name', value: name ?? 'Unknown', inline: true },
			{ name: 'ID', value: id, inline: true },
			{ name: 'Type', value: ChannelType[(channel as GuildChannel).type], inline: true }
		)
		.setTimestamp();

	try {
		await logChannelObj.send({ embeds: [embed] });
		info('channelDelete: logged deleted channel', { guildId: guild.id, channelId: id });
	} catch (err) {
		logError('channelDelete: failed to send log message', { err: String(err), guildId: guild.id, channelId: id });
	}
});