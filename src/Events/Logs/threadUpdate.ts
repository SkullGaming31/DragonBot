import { AnyThreadChannel, ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'threadUpdate'>('threadUpdate', async (oldThread: AnyThreadChannel, newThread: AnyThreadChannel) => {
	const { guild } = newThread;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('threadUpdate: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
		return;
	}
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelObj) {
		try {
			// try fetch as fallback
			logsChannelObj = (await guild.channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
		} catch (err) {
			logError('threadUpdate: failed to fetch logs channel', { error: (err as Error)?.message ?? err });
			return;
		}
	}
	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText || typeof (logsChannelObj as unknown as { send?: unknown }).send !== 'function') return;

	//#region Variables
	let threadStarter;
	try {
		threadStarter = await oldThread.fetchOwner({ cache: true }).catch(() => undefined);
	} catch (err) {
		logError('threadUpdate: failed to fetch thread owner', { error: (err as Error)?.message ?? err });
	}
	//#endregion

	const embed = new EmbedBuilder()
		.setDescription('A thread name has been updated')
		.setColor('Green')
		.addFields([
			{
				name: 'Thread Starter:',
				value: `${threadStarter?.user?.globalName ?? 'Unknown'}`,
				inline: false
			},
			{
				name: 'Thread Name:',
				value: `${oldThread.name} → ${newThread.name}`,
				inline: false
			}
		])
		.setTimestamp();

	try {
		await logsChannelObj.send({ embeds: [embed] });
		logInfo('threadUpdate: sent thread update log', { guild: guild.id, thread: newThread.id });
	} catch (err) {
		logError('threadUpdate: failed to send embed', { error: (err as Error)?.message ?? err });
	}
});