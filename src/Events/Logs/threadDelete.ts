import { AnyThreadChannel, ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
// Removed quickfix any disable
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

export default new Event<'threadDelete'>('threadDelete', async (thread: AnyThreadChannel) => {
	const { guild, id, name } = thread;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('threadDelete: failed to read ChanLogger', { err: (err as MongooseError).message });
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
		} catch (_err) {
			logError('threadDelete: failed to fetch logs channel', { err: String(_err) });
			return;
		}
	}

	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) {
		warn('threadDelete: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const parent = thread.parent;
	if (parent?.type !== ChannelType.GuildForum) return;

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle('Thread deleted')
		.addFields(
			{ name: 'Name', value: name ?? 'unknown', inline: true },
			{ name: 'ID', value: id, inline: true }
		)
		.setTimestamp();

	try {

		 
		const possibleSender = logsChannelObj as unknown as { send?: (..._args: unknown[]) => Promise<unknown> } | undefined;
		if (possibleSender && typeof possibleSender.send === 'function') {
			await possibleSender.send({ embeds: [embed] });
			info('threadDelete: logged thread delete', { guildId: guild.id, threadId: id });
		}
	} catch (err) {
		logError('threadDelete: failed to send log message', { err: String(err), guildId: guild.id, threadId: id });
	}
});