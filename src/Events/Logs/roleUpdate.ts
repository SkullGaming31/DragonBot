import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import DB from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';

export default new Event('roleUpdate', async (oldRole: Role, newRole: Role) => {
	const { guild, name, color } = newRole;

	// Check if the roles are identical
	if (oldRole.equals(newRole)) return;

	// Check if only color was changed
	if (oldRole.name === newRole.name && oldRole.color === newRole.color) return;

	const data = await DB.findOne({ Guild: guild.id }).catch((err: MongooseError) => {
		console.error(err.message);
	});

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;

	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const Embed = new EmbedBuilder()
		.setTitle(`${guild.name}'s Logs | Role Updated`)
		.setDescription(`\`${oldRole.name}\` has been updated to \`${name}\`, Color: \`${oldRole.color}\``)
		.setColor(newRole.color)
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [Embed] });
	} catch (error) {
		console.error(error);
	}
});