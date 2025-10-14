import { AnyThreadChannel, ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'threadDelete'>('threadDelete', async (thread: AnyThreadChannel) => {
	const { guild } = thread;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => console.error(err.message));
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) return;

	const parent = thread.parent;

	if (parent?.type !== ChannelType.GuildForum) return;

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setDescription(`A thread has been Deleted named: ${thread}, **${thread.name}**`)
		.setTimestamp();

	await logsChannelObj.send({ embeds: [embed] });
});