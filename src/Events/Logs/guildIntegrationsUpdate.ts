import { ChannelType, EmbedBuilder, Guild, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'guildIntegrationsUpdate'>('guildIntegrationsUpdate', async (guild: Guild) => {
	const { channels } = guild;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	// const inter = await guild.fetchIntegrations();

	const embed = new EmbedBuilder()
		.setTitle(guild.name)
		.setDescription('Not implemented yet!')
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});