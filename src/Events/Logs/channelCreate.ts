import { ChannelType, EmbedBuilder, GuildChannel, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';

export default new Event<'channelCreate'>('channelCreate', async (channel: GuildChannel) => {
	const { guild, name } = channel;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => console.error(err.message));
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setDescription(`A channel has been created named: ${channel}, **${name}**`)
		.setTimestamp();

	await logsChannelObj.send({ embeds: [embed] });
});