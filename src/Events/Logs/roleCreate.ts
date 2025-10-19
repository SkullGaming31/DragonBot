import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

/* eslint-disable @typescript-eslint/no-explicit-any -- quickfix: replace any with proper types later */
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
		} catch (err) {
			logError('roleCreate: failed to fetch logs channel', { err: String(err) });
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
		if ('send' in (logsChannelOBJ as any) && typeof (logsChannelOBJ as any).send === 'function') {
			await (logsChannelOBJ as any).send({ embeds: [embed] });
			info('roleCreate: logged role create', { guildId: guild.id, roleId: id });
		}
	} catch (err) {
		logError('roleCreate: failed to send log message', { err: String(err), guildId: guild.id, roleId: id });
	}
});