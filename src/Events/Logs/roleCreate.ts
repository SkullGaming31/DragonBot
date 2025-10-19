import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

export default new Event('roleCreate', async (role: Role) => {
	const { guild, id, name } = role;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('roleCreate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data?.Channel;
	if (!logsChannelID) return;

	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelOBJ = fetched as TextBasedChannel | undefined;
		} catch (_err) {
			logError('roleCreate: failed to fetch logs channel', { err: String(_err) });
			return;
		}
	}

	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) {
		warn('roleCreate: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle('Role created')
		.addFields(
			{ name: 'Name', value: name ?? 'unknown', inline: true },
			{ name: 'ID', value: id, inline: true }
		)
		.setColor(role.color || 'Random')
		.setTimestamp();

	try {
		const possibleSender = logsChannelOBJ as unknown as { send?: (...args: unknown[]) => Promise<unknown> } | undefined;
		if (possibleSender && typeof possibleSender.send === 'function') {
			await possibleSender.send({ embeds: [embed] });
			info('roleCreate: logged role create', { guildId: guild.id, roleId: id });
		}
	} catch (err) {
		logError('roleCreate: failed to send log message', { err: String(err), guildId: guild.id, roleId: id });
	}
});