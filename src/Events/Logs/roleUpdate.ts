import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import DB from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

export default new Event('roleUpdate', async (oldRole: Role, newRole: Role) => {
	const { guild } = newRole;

	// Check if the roles are identical
	if (oldRole.equals(newRole)) return;

	// Check if only color was changed
	if (oldRole.name === newRole.name && oldRole.color === newRole.color) return;

	let data;
	try {
		data = await DB.findOne({ Guild: guild.id });
	} catch (err) {
		logError('roleUpdate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelOBJ = fetched as TextBasedChannel | undefined;
		} catch (err) {
			logError('roleUpdate: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) {
		warn('roleUpdate: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const color = newRole.color || oldRole.color || 'Random';

	const embed = new EmbedBuilder()
		.setTitle(`${guild.name} | Role Updated`)
		.addFields(
			{ name: 'Old name', value: oldRole.name ?? 'unknown', inline: true },
			{ name: 'New name', value: newRole.name ?? 'unknown', inline: true },
			{ name: 'Role ID', value: newRole.id, inline: true }
		)
		.setColor(color)
		.setTimestamp();

	try {
		// Narrow: ensure logsChannelOBJ has a send function before calling


		 
		const possibleSender = logsChannelOBJ as unknown as { send?: (..._args: unknown[]) => Promise<unknown> } | undefined;
		if (possibleSender && typeof possibleSender.send === 'function') {
			await possibleSender.send({ embeds: [embed] });
			info('roleUpdate: logged role update', { guildId: guild.id, roleId: newRole.id });
		}
	} catch (err) {
		logError('roleUpdate: failed to send log message', { err: String(err), guildId: guild.id, roleId: newRole.id });
	}
});