import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'roleCreate'>('roleCreate', async (role: Role) => {
	const { guild, name } = role;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data?.Channel;
	if (logsChannelID === undefined) return;

	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const Embed = new EmbedBuilder()
		.setTitle('Role Created')
		.setDescription(`a role has been created named: ${role}, \`${name}\``)
		.setColor(role.color)
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [Embed] });
	} catch (error) {
		console.error(error);
	}
});