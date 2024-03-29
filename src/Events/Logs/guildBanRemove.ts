import { ChannelType, EmbedBuilder, GuildBan, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';

export default new Event<'guildBanRemove'>('guildBanRemove', async (ban: GuildBan) => {
	const { guild, user } = ban;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setTitle('User UnBanned')
		.setDescription(`\`${user.globalName}\`(${user.id}) has been removed from the ban list for this server`)
		.setColor('Green')
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});