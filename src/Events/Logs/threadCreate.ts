import { AnyThreadChannel, ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
/* eslint-disable @typescript-eslint/no-explicit-any -- quickfix: replace any with proper types later */
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

export default new Event<'threadCreate'>('threadCreate', async (thread: AnyThreadChannel, newlyCreated: boolean) => {
	const { guild, id, name } = thread;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('threadCreate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	let logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelObj) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelObj = fetched as TextBasedChannel | undefined;
		} catch (err) {
			logError('threadCreate: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) {
		warn('threadCreate: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setTitle('Thread created')
		.addFields(
			{ name: 'Name', value: name ?? 'unknown', inline: true },
			{ name: 'ID', value: id, inline: true },
			{ name: 'Newly Created', value: newlyCreated ? 'Yes' : 'No', inline: true }
		)
		.setTimestamp();

	try {
		if ('send' in (logsChannelObj as any) && typeof (logsChannelObj as any).send === 'function') {
			await (logsChannelObj as any).send({ embeds: [embed] });
			info('threadCreate: logged thread create', { guildId: guild.id, threadId: id });
		}
	} catch (err) {
		logError('threadCreate: failed to send log message', { err: String(err), guildId: guild.id, threadId: id });
	}
});