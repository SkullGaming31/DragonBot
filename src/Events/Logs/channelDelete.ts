import { ChannelType, DMChannel, EmbedBuilder, GuildChannel, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';

export default new Event<'channelDelete'>('channelDelete', async (channel: GuildChannel | DMChannel) => {
	if (channel.isDMBased()) return;

	const { guild, name } = channel;
	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => {console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logChannelObj || logChannelObj.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder().setColor('Red').setDescription(`A channel has been deleted named: ${channel}, **${name}**`).setTimestamp();

	try {
		await logChannelObj.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});