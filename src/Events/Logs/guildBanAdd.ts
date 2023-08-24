import { ChannelType, EmbedBuilder, GuildBan, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB

export default new Event<'guildBanAdd'>('guildBanAdd', async (ban: GuildBan) => {
	const { guild, user } = ban;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder().setColor('Red').setTitle(`${guild.name}'s Logs | User Banned`).setDescription(`\`${user.username}#${user.discriminator}\`(${user.id}) has been banned from the server`).setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});