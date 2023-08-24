import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import DB from '../../Database/Schemas/LogsChannelDB'; // DB

export default new Event<'roleUpdate'>('roleUpdate', async (oldRole: Role, newRole: Role) => {
	const { guild, name } = newRole;

	const data = await DB.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const Embed = new EmbedBuilder().setTitle(`${guild.name}'s Logs | Role Updated`).setDescription(`${oldRole.name} has been updated from ${name} Color: ${oldRole.color}`).setColor(newRole.color).setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [Embed] });
	} catch (error) {
		console.error(error);
	}
});