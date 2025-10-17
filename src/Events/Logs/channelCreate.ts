import { ChannelType, EmbedBuilder, GuildChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { warn, error as logError, info } from '../../Utilities/logger';

export default new Event<'channelCreate'>('channelCreate', async (channel: GuildChannel) => {
	const { guild, name, id } = channel;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('channelCreate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	// Try cache first then fetch as fallback
	let logsChannelObj = guild.channels.cache.get(logsChannelID);
	if (!logsChannelObj) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelObj = fetched ?? undefined;
		} catch (err) {
			logError('channelCreate: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) {
		warn('channelCreate: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setTitle('Channel created')
		.addFields(
			{ name: 'Name', value: name ?? 'Unknown', inline: true },
			{ name: 'ID', value: id, inline: true },
			{ name: 'Type', value: ChannelType[channel.type], inline: true }
		)
		.setTimestamp();

	try {
		await logsChannelObj.send({ embeds: [embed] });
		info('channelCreate: logged new channel', { guildId: guild.id, channelId: id });
	} catch (err) {
		logError('channelCreate: failed to send log message', { err: String(err), guildId: guild.id, channelId: id });
	}
});