import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event<'roleDelete'>('roleDelete', async (role: Role) => {
	const { guild, name } = role;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || !data.enableLogs) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const Embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle(`${guild.name} | Role Deleted`)
		.setDescription(`A role named: \`${name}\` has been deleted.`)
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [Embed] });
	} catch (error) {
		console.error(error);
	}
});